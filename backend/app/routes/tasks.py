from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

from app import db
from app.models import Task

bp = Blueprint("tasks", __name__, url_prefix="/tasks")

ALLOWED_STATUSES = {"pending", "in_progress", "completed"}


@bp.get("")
@jwt_required()
def list_tasks():
    user_id = int(get_jwt_identity())
    role = get_jwt().get("role")
    if role == "admin":
        tasks = Task.query.all()
    else:
        tasks = Task.query.filter_by(user_id=user_id).all()
    return jsonify([t.to_dict() for t in tasks]), 200

@bp.post("")
@jwt_required()
def create_task():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    description = data.get("description")
    status = (data.get("status") or "pending").strip().lower()
    if not title:
        return jsonify({"error": "title is required"}), 400
    if status not in ALLOWED_STATUSES:
        return jsonify({"error": f"status must be one of {sorted(ALLOWED_STATUSES)}"}), 400
    task = Task(title=title, description=description, status=status, user_id=user_id)
    db.session.add(task)
    db.session.commit()

    return jsonify(task.to_dict()), 201

@bp.put("/<int:task_id>")
@jwt_required()
def update_task(task_id):
    user_id = int(get_jwt_identity())
    role = get_jwt().get("role")
    task = Task.query.get(task_id)
    if task is None:
        return jsonify({"error": "task not found"}), 404
    if task.user_id != user_id and role!="admin":
        return jsonify({"error": "forbidden"}), 403
    data = request.get_json(silent=True) or {}
    if "title" in data:
        title = (data.get("title") or "").strip()
        if not title:
            return jsonify({"error": "title cannot be empty"}), 400
        task.title = title
    if "description" in data:
        task.description = data.get("description")
    if "status" in data:
        status = (data.get("status") or "").strip().lower()
        if status not in ALLOWED_STATUSES:
            return jsonify({"error": f"status msut be one of {sorted(ALLOWED_STATUSES)}"}), 400
        task.status = status
    db.session.commit()
    return jsonify(task.to_dict()), 200

@bp.delete("/<int:task_id>")
@jwt_required()
def delete_task(task_id):
    user_id = int(get_jwt_identity())
    role = get_jwt().get("role")
    task = Task.query.get(task_id)
    if task is None:
        return jsonify({"error":"task not found"}), 404
    if task.user_id!=user_id and role!="admin":
        return jsonify({"error":"forbidden"}), 403
    db.session.delete(task)
    db.session.commit()
    return jsonify({"msg":"task deleted", "id":task_id}), 200
    