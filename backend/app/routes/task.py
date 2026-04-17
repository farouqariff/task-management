from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

from app import db
from app.models.task import Task
from app.schemas.task_schema import TaskSchema

bp = Blueprint("tasks", __name__, url_prefix="/tasks")

task_schema = TaskSchema()
tasks_schema = TaskSchema(many=True)


def _get_task_or_error(task_id):
    task = Task.query.get(task_id)
    if not task:
        return None, (jsonify({"error": "task not found"}), 404)

    if task.user_id != int(get_jwt_identity()) and get_jwt().get("role") != "admin":
        return None, (jsonify({"error": "forbidden"}), 403)

    return task, None


# LIST
@bp.get("")
@jwt_required()
def list_tasks():
    uid = int(get_jwt_identity())

    if get_jwt().get("role") == "admin":
        tasks = Task.query.all()
    else:
        tasks = Task.query.filter_by(user_id=uid).all()

    return tasks_schema.dump(tasks), 200


# CREATE
@bp.post("")
@jwt_required()
def create_task():
    data = request.get_json()

    try:
        task = task_schema.load(data)   # validation + parsing
    except Exception as err:
        return jsonify(err.messages), 400

    task.user_id = int(get_jwt_identity())

    db.session.add(task)
    db.session.commit()

    return task_schema.dump(task), 201


# UPDATE
@bp.put("/<int:task_id>")
@jwt_required()
def update_task(task_id):
    task, err = _get_task_or_error(task_id)
    if err:
        return err

    data = request.get_json()

    try:
        task = task_schema.load(data, instance=task, partial=True)
    except Exception as err:
        return jsonify(err.messages), 400

    db.session.commit()

    return task_schema.dump(task), 200


# DELETE
@bp.delete("/<int:task_id>")
@jwt_required()
def delete_task(task_id):
    task, err = _get_task_or_error(task_id)
    if err:
        return err

    db.session.delete(task)
    db.session.commit()

    return jsonify({"msg": "task deleted", "id": task_id}), 200