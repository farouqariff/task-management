from flask import Blueprint, jsonify, request

from app.models.audit_log import AuditLog
from app.schemas.audit_log_schema import AuditLogSchema
from app.utils.auth import admin_required

bp = Blueprint("audit", __name__, url_prefix="/audit")

logs_schema = AuditLogSchema(many=True)


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
    return jsonify({
        "items": logs_schema.dump(pagination.items),
        "total": pagination.total,
        "page": pagination.page,
        "per_page": pagination.per_page,
    }), 200
