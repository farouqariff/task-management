from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy.orm import joinedload, selectinload

from app import db
from app.models.task import Task
from app.models.task_assignee import TaskAssignee
from app.models.notification import Notification
from app.models.project import Project
from app.models.project_member import ProjectMember
from app.models.user import User
from app.schemas.task_schema import (
    TaskSchema,
    TaskAssigneeSchema,
    TaskAssigneeUpdateSchema,
    TaskAssigneeCreateSchema,
)
from app.utils.auth import (
    current_user,
    can_view_task,
    can_manage_task,
    can_view_project,
    write_audit,
)

bp = Blueprint("tasks", __name__, url_prefix="/tasks")

task_schema = TaskSchema()
tasks_schema = TaskSchema(many=True)
assignee_schema = TaskAssigneeSchema()
assignees_schema = TaskAssigneeSchema(many=True)
assignee_update_schema = TaskAssigneeUpdateSchema()
assignee_create_schema = TaskAssigneeCreateSchema()


@bp.get("")
@jwt_required()
def list_tasks():
    me_ = current_user()
    if not me_:
        return jsonify({"error": "user not found"}), 404

    project_id = request.args.get("project_id", type=int)

    _eager = [
        joinedload(Task.creator),
        joinedload(Task.project),
        selectinload(Task.assignees).joinedload(TaskAssignee.user),
    ]

    if me_.is_admin:
        query = Task.query.options(*_eager)
        if project_id:
            query = query.filter(Task.project_id == project_id)
        tasks = query.order_by(Task.id.desc()).all()
    else:
        query = (
            Task.query
            .options(*_eager)
            .outerjoin(ProjectMember, ProjectMember.project_id == Task.project_id)
            .outerjoin(TaskAssignee, TaskAssignee.task_id == Task.id)
            .filter(
                (Task.created_by == me_.id)
                | (ProjectMember.user_id == me_.id)
                | (TaskAssignee.user_id == me_.id)
            )
        )
        if project_id:
            query = query.filter(Task.project_id == project_id)
        tasks = query.distinct().order_by(Task.id.desc()).all()
    return jsonify(tasks_schema.dump(tasks)), 200


@bp.post("")
@jwt_required()
def create_task():
    me_ = current_user()
    if not me_:
        return jsonify({"error": "user not found"}), 404

    task = task_schema.load(request.get_json(silent=True) or {})

    project = Project.query.get(task.project_id)
    if not project:
        return jsonify({"error": "project not found"}), 404
    if not can_view_project(me_, project):
        return jsonify({"error": "forbidden"}), 403
    if project.is_completed:
        return jsonify({"error": "project is completed — no new tasks allowed"}), 400

    task.created_by = me_.id
    db.session.add(task)
    db.session.flush()

    if project.is_personal:
        db.session.add(TaskAssignee(task_id=task.id, user_id=me_.id))

    write_audit("create", "task", task.id, {"name": task.name, "project_id": task.project_id}, resource_label=task.name)
    db.session.commit()
    return jsonify(task_schema.dump(task)), 201


@bp.get("/<int:task_id>")
@jwt_required()
def get_task(task_id):
    me_ = current_user()
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "task not found"}), 404
    if not can_view_task(me_, task):
        return jsonify({"error": "forbidden"}), 403
    return jsonify(task_schema.dump(task)), 200


@bp.put("/<int:task_id>")
@jwt_required()
def update_task(task_id):
    me_ = current_user()
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "task not found"}), 404

    payload = request.get_json(silent=True) or {}
    prev_status = task.status

    if can_manage_task(me_, task):
        task_schema.load(payload, instance=task, partial=True)
        if prev_status != "completed" and task.status == "completed" and task.created_by and task.created_by != me_.id:
            db.session.add(Notification(
                user_id=task.created_by,
                type="task",
                title="Your task was marked complete",
                message=f'"{task.name}" has been marked as complete',
                link=f"/project/{task.project_id}",
            ))
        write_audit("update", "task", task.id, payload, resource_label=task.name)
        db.session.commit()
        return jsonify(task_schema.dump(task)), 200

    if not task.has_assignee(me_.id):
        return jsonify({"error": "forbidden"}), 403

    data = assignee_update_schema.load(payload)
    if not data:
        return jsonify({"error": "status or priority required"}), 400
    for key, value in data.items():
        setattr(task, key, value)

    if prev_status != "completed" and task.status == "completed" and task.created_by and task.created_by != me_.id:
        db.session.add(Notification(
            user_id=task.created_by,
            type="task",
            title="Your task was marked complete",
            message=f'"{task.name}" has been marked as complete',
            link=f"/project/{task.project_id}",
        ))
    write_audit("update", "task", task.id, data, resource_label=task.name)
    db.session.commit()
    return jsonify(task_schema.dump(task)), 200


@bp.delete("/<int:task_id>")
@jwt_required()
def delete_task(task_id):
    me_ = current_user()
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "task not found"}), 404
    if not can_manage_task(me_, task):
        return jsonify({"error": "forbidden"}), 403

    deleted_name = task.name
    db.session.delete(task)
    write_audit("delete", "task", task_id, None, resource_label=deleted_name)
    db.session.commit()
    return jsonify({"msg": "task deleted", "id": task_id}), 200


# ----- Assignees -----

@bp.get("/<int:task_id>/assignees")
@jwt_required()
def list_assignees(task_id):
    me_ = current_user()
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "task not found"}), 404
    if not can_view_task(me_, task):
        return jsonify({"error": "forbidden"}), 403
    return jsonify(assignees_schema.dump(task.assignees)), 200


@bp.post("/<int:task_id>/assignees")
@jwt_required()
def add_assignee(task_id):
    me_ = current_user()
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "task not found"}), 404
    if not can_manage_task(me_, task):
        return jsonify({"error": "forbidden"}), 403

    data = assignee_create_schema.load(request.get_json(silent=True) or {})
    user_id = data["user_id"]

    if not User.query.get(user_id):
        return jsonify({"error": "user not found"}), 404
    if task.has_assignee(user_id):
        return jsonify({"error": "already assigned"}), 409
    if task.project and not task.project.has_member(user_id):
        return jsonify({"error": "user must be a project member first"}), 400

    assignee = TaskAssignee(task_id=task_id, user_id=user_id)
    db.session.add(assignee)
    if user_id != me_.id:
        db.session.add(Notification(
            user_id=user_id,
            type="task",
            title="You've been assigned to a task",
            message=f'You have been assigned to "{task.name}" in "{task.project.name}"',
            link=f"/project/{task.project_id}",
        ))
    write_audit("add_assignee", "task", task_id, {"user_id": user_id}, resource_label=task.name)
    db.session.commit()
    return jsonify(assignee_schema.dump(assignee)), 201


@bp.delete("/<int:task_id>/assignees/<int:user_id>")
@jwt_required()
def remove_assignee(task_id, user_id):
    me_ = current_user()
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "task not found"}), 404
    if not can_manage_task(me_, task):
        return jsonify({"error": "forbidden"}), 403

    assignee = TaskAssignee.query.filter_by(task_id=task_id, user_id=user_id).first()
    if not assignee:
        return jsonify({"error": "assignee not found"}), 404

    if user_id != me_.id:
        db.session.add(Notification(
            user_id=user_id,
            type="task",
            title="You've been unassigned from a task",
            message=f'You have been removed from "{task.name}" in "{task.project.name}"',
        ))
    db.session.delete(assignee)
    write_audit("remove_assignee", "task", task_id, {"user_id": user_id}, resource_label=task.name)
    db.session.commit()
    return jsonify({"msg": "assignee removed"}), 200
