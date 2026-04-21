from functools import wraps
from flask import jsonify, request, g
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

from app import db
from app.models.user import User
from app.models.project import Project
from app.models.task import Task
from app.models.audit_log import AuditLog


def current_user() -> User | None:
    if 'current_user' in g:
        return g.current_user
    uid = get_jwt_identity()
    if uid is None:
        g.current_user = None
        return None
    user = User.query.get(int(uid))
    g.current_user = user
    return user


def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        if not get_jwt().get("is_admin"):
            return jsonify({"error": "admin only"}), 403
        return fn(*args, **kwargs)
    return wrapper


def can_view_project(user: User, project: Project) -> bool:
    return user.is_admin or project.created_by == user.id or project.has_member(user.id)


def can_manage_project(user: User, project: Project) -> bool:
    """Leaders of the project, the creator, or an admin."""
    if user.is_admin or project.created_by == user.id:
        return True
    return user.id in project.leader_ids()


def can_view_task(user: User, task: Task) -> bool:
    if user.is_admin or task.created_by == user.id or task.has_assignee(user.id):
        return True
    return task.project is not None and task.project.has_member(user.id)


def can_manage_task(user: User, task: Task) -> bool:
    if user.is_admin or task.created_by == user.id:
        return True
    return task.project is not None and user.id in task.project.leader_ids()


def write_audit(action: str, resource_type: str, resource_id: int | None, changes: dict | None = None, actor_id: int | None = None, resource_label: str | None = None) -> None:
    try:
        uid = get_jwt_identity()
    except RuntimeError:
        uid = None
    resolved_id = actor_id if actor_id is not None else (int(uid) if uid is not None else None)
    actor_email = None
    if resolved_id:
        cached = getattr(g, 'current_user', None)
        if cached and cached.id == resolved_id:
            actor_email = cached.email
        else:
            actor = User.query.get(resolved_id)
            actor_email = actor.email if actor else None
    log = AuditLog(
        user_id=resolved_id,
        user_email=actor_email,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        resource_label=resource_label,
        changes=changes,
        ip_address=request.remote_addr,
    )
    db.session.add(log)
