from collections import defaultdict

from flask import Blueprint, jsonify, request

from app.models.audit_log import AuditLog
from app.models.user import User
from app.models.project import Project
from app.models.task import Task
from app.models.role import Role
from app.models.permission import Permission
from app.schemas.audit_log_schema import AuditLogSchema
from app.utils.auth import admin_required

bp = Blueprint("audit", __name__, url_prefix="/audit")

logs_schema = AuditLogSchema(many=True)

_RESOURCE_MODEL_FIELD = {
    "user": (User, "email"),
    "project": (Project, "name"),
    "task": (Task, "name"),
    "role": (Role, "name"),
    "permission": (Permission, "name"),
}


@bp.get("")
@admin_required
def list_audit_logs():
    page = int(request.args.get("page", 1))
    per_page = min(int(request.args.get("per_page", 50)), 200)
    resource_type = request.args.get("resource_type")
    user_id = request.args.get("user_id")

    query = AuditLog.query
    if resource_type:
        query = query.filter_by(resource_type=resource_type)
    if user_id:
        query = query.filter_by(user_id=int(user_id))

    pagination = query.order_by(AuditLog.id.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    items = logs_schema.dump(pagination.items)

    grouped = defaultdict(set)
    for item in items:
        rtype = item.get("resource_type")
        rid = item.get("resource_id")
        if rid and rtype in _RESOURCE_MODEL_FIELD:
            grouped[rtype].add(rid)

    label_map = {}
    for rtype, ids in grouped.items():
        model, field = _RESOURCE_MODEL_FIELD[rtype]
        records = model.query.filter(model.id.in_(ids)).all()
        for record in records:
            label_map[(rtype, record.id)] = getattr(record, field)

    for item in items:
        rtype = item.get("resource_type")
        rid = item.get("resource_id")
        item["resource_label"] = label_map.get((rtype, rid)) if rtype and rid else None

    return jsonify({
        "items": items,
        "total": pagination.total,
        "page": pagination.page,
        "per_page": pagination.per_page,
    }), 200
