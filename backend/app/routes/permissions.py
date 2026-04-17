from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError

from app import db
from app.models.permission import Permission
from app.models.user_permission import UserPermission
from app.schemas.permission_schema import PermissionSchema, PermissionGrantSchema
from app.utils.auth import admin_required, write_audit

bp = Blueprint("permissions", __name__, url_prefix="/permissions")

permission_schema = PermissionSchema()
permissions_schema = PermissionSchema(many=True)
grant_schema = PermissionGrantSchema()


@bp.get("")
@admin_required
def list_permissions():
    return jsonify(permissions_schema.dump(Permission.query.all())), 200


@bp.post("")
@admin_required
def create_permission():
    perm = permission_schema.load(request.get_json(silent=True) or {})

    try:
        db.session.add(perm)
        db.session.flush()
        write_audit("create", "permission", perm.id, {"name": perm.name})
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "permission name already exists"}), 409

    return jsonify(permission_schema.dump(perm)), 201


@bp.get("/<int:permission_id>")
@admin_required
def get_permission(permission_id):
    perm = Permission.query.get(permission_id)
    if not perm:
        return jsonify({"error": "permission not found"}), 404
    return jsonify(permission_schema.dump(perm)), 200


@bp.put("/<int:permission_id>")
@admin_required
def update_permission(permission_id):
    perm = Permission.query.get(permission_id)
    if not perm:
        return jsonify({"error": "permission not found"}), 404

    payload = request.get_json(silent=True) or {}
    permission_schema.load(payload, instance=perm, partial=True)

    try:
        write_audit("update", "permission", perm.id, payload)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "permission name already exists"}), 409

    return jsonify(permission_schema.dump(perm)), 200


@bp.delete("/<int:permission_id>")
@admin_required
def delete_permission(permission_id):
    perm = Permission.query.get(permission_id)
    if not perm:
        return jsonify({"error": "permission not found"}), 404

    db.session.delete(perm)
    write_audit("delete", "permission", permission_id, None)
    db.session.commit()
    return jsonify({"msg": "permission deleted", "id": permission_id}), 200


# ----- Direct user grants (bypass role) -----

@bp.post("/<int:permission_id>/users")
@admin_required
def grant_to_user(permission_id):
    perm = Permission.query.get(permission_id)
    if not perm:
        return jsonify({"error": "permission not found"}), 404

    data = grant_schema.load(request.get_json(silent=True) or {})
    user_id = data["user_id"]

    if UserPermission.query.filter_by(user_id=user_id, permission_id=permission_id).first():
        return jsonify({"error": "user already has permission"}), 409

    db.session.add(UserPermission(user_id=user_id, permission_id=permission_id))
    write_audit("grant_permission", "user", user_id, {"permission_id": permission_id})
    db.session.commit()
    return jsonify({"msg": "permission granted"}), 201


@bp.delete("/<int:permission_id>/users/<int:user_id>")
@admin_required
def revoke_from_user(permission_id, user_id):
    up = UserPermission.query.filter_by(user_id=user_id, permission_id=permission_id).first()
    if not up:
        return jsonify({"error": "mapping not found"}), 404

    db.session.delete(up)
    write_audit("revoke_permission", "user", user_id, {"permission_id": permission_id})
    db.session.commit()
    return jsonify({"msg": "permission revoked"}), 200
