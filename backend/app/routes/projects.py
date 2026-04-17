from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from app import db
from app.models.project import Project
from app.models.project_member import ProjectMember
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

    if me_.is_admin:
        projects = Project.query.order_by(Project.id.desc()).all()
    else:
        projects = (
            Project.query
            .outerjoin(ProjectMember, ProjectMember.project_id == Project.id)
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

    project = project_schema.load(request.get_json(silent=True) or {})
    project.created_by = me_.id

    db.session.add(project)
    db.session.flush()
    db.session.add(ProjectMember(project_id=project.id, user_id=me_.id, role="leader"))

    write_audit("create", "project", project.id, {"name": project.name})
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
    project_schema.load(payload, instance=project, partial=True)

    write_audit("update", "project", project.id, payload)
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

    db.session.delete(project)
    write_audit("delete", "project", project_id, None)
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

    data = member_create_schema.load(request.get_json(silent=True) or {})

    if not User.query.get(data["user_id"]):
        return jsonify({"error": "user not found"}), 404
    if project.has_member(data["user_id"]):
        return jsonify({"error": "user is already a member"}), 409

    member = ProjectMember(project_id=project_id, user_id=data["user_id"], role=data["role"])
    db.session.add(member)
    write_audit("add_member", "project", project_id, data)
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

    member = ProjectMember.query.filter_by(project_id=project_id, user_id=user_id).first()
    if not member:
        return jsonify({"error": "member not found"}), 404

    db.session.delete(member)
    write_audit("remove_member", "project", project_id, {"user_id": user_id})
    db.session.commit()
    return jsonify({"msg": "member removed"}), 200
