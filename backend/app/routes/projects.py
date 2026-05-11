from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy.orm import joinedload, selectinload

from app import db
from app.models.project import Project
from app.models.project_member import ProjectMember
from app.models.notification import Notification
from app.models.user import User
from app.schemas.project_schema import (
    ProjectSchema,
    ProjectMemberSchema,
    ProjectMemberCreateSchema,
)
from app.utils.auth import (
    current_user,
    can_view_project,
    can_manage_project,
    write_audit,
)

bp = Blueprint("projects", __name__, url_prefix="/projects")

project_schema = ProjectSchema()
projects_schema = ProjectSchema(many=True)
member_schema = ProjectMemberSchema()
members_schema = ProjectMemberSchema(many=True)
member_create_schema = ProjectMemberCreateSchema()


@bp.get("")
@jwt_required()
def list_projects():
    me_ = current_user()
    if not me_:
        return jsonify({"error": "user not found"}), 404

    _eager = [
        joinedload(Project.creator),
        selectinload(Project.members).joinedload(ProjectMember.user),
    ]

    if me_.is_admin:
        projects = (
            Project.query
            .options(*_eager)
            .filter_by(is_personal=False)
            .order_by(Project.id.desc())
            .all()
        )
    else:
        projects = (
            Project.query
            .options(*_eager)
            .outerjoin(ProjectMember, ProjectMember.project_id == Project.id)
            .filter(Project.is_personal == False)
            .filter((Project.created_by == me_.id) | (ProjectMember.user_id == me_.id))
            .distinct()
            .order_by(Project.id.desc())
            .all()
        )
    return jsonify(projects_schema.dump(projects)), 200


@bp.post("")
@jwt_required()
def create_project():
    me_ = current_user()
    if not me_:
        return jsonify({"error": "user not found"}), 404
    if not me_.is_admin:
        return jsonify({"error": "forbidden"}), 403

    payload = request.get_json(silent=True) or {}
    leader_id = payload.get("leader_id")
    if not leader_id:
        return jsonify({"error": "leader_id is required"}), 400
    if not User.query.get(leader_id):
        return jsonify({"error": "leader user not found"}), 404

    project = project_schema.load({"name": payload.get("name")})
    project.created_by = me_.id

    db.session.add(project)
    db.session.flush()
    db.session.add(ProjectMember(project_id=project.id, user_id=leader_id, role="leader"))
    db.session.add(Notification(
        user_id=leader_id,
        type="project",
        title="You've been assigned as project leader",
        message=f'You are now the leader of "{project.name}"',
        link=f"/project/{project.id}",
    ))

    write_audit("create", "project", project.id, {"name": project.name, "leader_id": leader_id}, resource_label=project.name)
    db.session.commit()
    return jsonify(project_schema.dump(project)), 201


@bp.get("/<int:project_id>")
@jwt_required()
def get_project(project_id):
    me_ = current_user()
    project = Project.query.get(project_id)
    if not project:
        return jsonify({"error": "project not found"}), 404
    if not can_view_project(me_, project):
        return jsonify({"error": "forbidden"}), 403
    return jsonify(project_schema.dump(project)), 200


@bp.put("/<int:project_id>")
@jwt_required()
def update_project(project_id):
    me_ = current_user()
    project = Project.query.get(project_id)
    if not project:
        return jsonify({"error": "project not found"}), 404
    if not can_manage_project(me_, project):
        return jsonify({"error": "forbidden"}), 403

    payload = request.get_json(silent=True) or {}
    leader_id = payload.pop("leader_id", None)

    if project.is_completed:
        if not me_.is_admin:
            return jsonify({"error": "project is completed — no changes allowed"}), 403
        if leader_id is not None or payload != {"is_completed": False}:
            return jsonify({"error": "project is completed — only uncompleting is allowed"}), 400

    if leader_id is not None:
        if not User.query.get(leader_id):
            return jsonify({"error": "leader user not found"}), 404
        new_leader_member = ProjectMember.query.filter_by(
            project_id=project_id, user_id=leader_id
        ).first()
        if not new_leader_member:
            return jsonify({"error": "new leader must already be a project member"}), 400
        for m in ProjectMember.query.filter_by(project_id=project_id, role="leader").all():
            m.role = "member"
        new_leader_member.role = "leader"
        db.session.add(Notification(
            user_id=leader_id,
            type="project",
            title="You're now the project leader",
            message=f'You are now the leader of "{project.name}"',
            link=f"/project/{project.id}",
        ))

    was_completed = project.is_completed
    if payload:
        project_schema.load(payload, instance=project, partial=True)

    if was_completed and not project.is_completed and not me_.is_admin:
        return jsonify({"error": "Only admins can revert a completed project"}), 403

    if not was_completed and project.is_completed:
        for lid in project.leader_ids():
            db.session.add(Notification(
                user_id=lid,
                type="project",
                title="Project marked as complete",
                message=f'"{project.name}" has been marked complete',
                link=f"/project/{project.id}",
            ))

    write_audit("update", "project", project.id, {**payload, **({"leader_id": leader_id} if leader_id else {})}, resource_label=project.name)
    db.session.commit()
    return jsonify(project_schema.dump(project)), 200


@bp.delete("/<int:project_id>")
@jwt_required()
def delete_project(project_id):
    me_ = current_user()
    project = Project.query.get(project_id)
    if not project:
        return jsonify({"error": "project not found"}), 404
    if not (me_.is_admin or project.created_by == me_.id):
        return jsonify({"error": "forbidden"}), 403

    deleted_name = project.name
    db.session.delete(project)
    write_audit("delete", "project", project_id, None, resource_label=deleted_name)
    db.session.commit()
    return jsonify({"msg": "project deleted", "id": project_id}), 200


# ----- Members -----

@bp.get("/<int:project_id>/members")
@jwt_required()
def list_members(project_id):
    me_ = current_user()
    project = Project.query.get(project_id)
    if not project:
        return jsonify({"error": "project not found"}), 404
    if not can_view_project(me_, project):
        return jsonify({"error": "forbidden"}), 403
    return jsonify(members_schema.dump(project.members)), 200


@bp.post("/<int:project_id>/members")
@jwt_required()
def add_member(project_id):
    me_ = current_user()
    project = Project.query.get(project_id)
    if not project:
        return jsonify({"error": "project not found"}), 404
    if not can_manage_project(me_, project):
        return jsonify({"error": "forbidden"}), 403

    if project.is_completed:
        return jsonify({"error": "project is completed — no changes allowed"}), 400

    data = member_create_schema.load(request.get_json(silent=True) or {})

    if not User.query.get(data["user_id"]):
        return jsonify({"error": "user not found"}), 404
    if project.has_member(data["user_id"]):
        return jsonify({"error": "user is already a member"}), 409
    if data["role"] == "leader":
        existing_leader = ProjectMember.query.filter_by(project_id=project_id, role="leader").first()
        if existing_leader:
            return jsonify({"error": "project already has a leader — reassign or remove the current leader first"}), 409

    member = ProjectMember(project_id=project_id, user_id=data["user_id"], role=data["role"])
    db.session.add(member)
    db.session.add(Notification(
        user_id=data["user_id"],
        type="project",
        title="You've been added to a project",
        message=f'You are now a member of "{project.name}"',
        link=f"/project/{project.id}",
    ))
    write_audit("add_member", "project", project_id, data, resource_label=project.name)
    db.session.commit()
    return jsonify(member_schema.dump(member)), 201


@bp.delete("/<int:project_id>/members/<int:user_id>")
@jwt_required()
def remove_member(project_id, user_id):
    me_ = current_user()
    project = Project.query.get(project_id)
    if not project:
        return jsonify({"error": "project not found"}), 404
    if not can_manage_project(me_, project):
        return jsonify({"error": "forbidden"}), 403

    if project.is_completed:
        return jsonify({"error": "project is completed — no changes allowed"}), 400

    member = ProjectMember.query.filter_by(project_id=project_id, user_id=user_id).first()
    if not member:
        return jsonify({"error": "member not found"}), 404

    db.session.add(Notification(
        user_id=user_id,
        type="project",
        title="You've been removed from a project",
        message=f'You have been removed from "{project.name}"',
    ))
    db.session.delete(member)
    write_audit("remove_member", "project", project_id, {"user_id": user_id}, resource_label=project.name)
    db.session.commit()
    return jsonify({"msg": "member removed"}), 200
