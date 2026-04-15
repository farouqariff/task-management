from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

from app import db
from app.models import Task

bp = Blueprint("tasks", __name__, url_prefix="/tasks")

ALLOWED_STATUSES = {"pending", "in_progress", "completed"}


def _get_task_or_error(task_id):
    task = Task.query.get(task_id)
    if not task:
        return None, (jsonify({"error": "task not found"}), 404)
    if task.user_id != int(get_jwt_identity()) and get_jwt().get("role") != "admin":
        return None, (jsonify({"error": "forbidden"}), 403)
    return task, None


def _validate_status(status):
    status = (status or "").strip().lower()
    if status not in ALLOWED_STATUSES:
        return None, (jsonify({"error": f"status must be one of {sorted(ALLOWED_STATUSES)}"}), 400)
    return status, None


@bp.get("")
@jwt_required()
def list_tasks():
    uid = int(get_jwt_identity())
    tasks = Task.query.all() if get_jwt().get("role") == "admin" else Task.query.filter_by(user_id=uid).all()
    return jsonify([t.to_dict() for t in tasks]), 200


@bp.post("")
@jwt_required()
def create_task():
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    if not title:
        return jsonify({"error": "title is required"}), 400
    status, err = _validate_status(data.get("status", "pending"))
    if err:
        return err
    task = Task(title=title, description=data.get("description"), status=status, user_id=int(get_jwt_identity()))
    db.session.add(task)
    db.session.commit()
    return jsonify(task.to_dict()), 201


@bp.put("/<int:task_id>")
@jwt_required()
def update_task(task_id):
    task, err = _get_task_or_error(task_id)
    if err:
        return err
    data = request.get_json(silent=True) or {}
    if "title" in data:
        title = (data["title"] or "").strip()
        if not title:
            return jsonify({"error": "title cannot be empty"}), 400
        task.title = title
    if "description" in data:
        task.description = data["description"]
    if "status" in data:
        status, err = _validate_status(data["status"])
        if err:
            return err
        task.status = status
    db.session.commit()
    return jsonify(task.to_dict()), 200


@bp.delete("/<int:task_id>")
@jwt_required()
def delete_task(task_id):
    task, err = _get_task_or_error(task_id)
    if err:
        return err
    db.session.delete(task)
    db.session.commit()
    return jsonify({"msg": "task deleted", "id": task_id}), 200