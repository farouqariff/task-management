from flask import Blueprint, request, jsonify
from sqlalchemy.exc import IntegrityError

from app import db
from app.models.role import Role
from app.models.permission import Permission
from app.models.role_permission import RolePermission
from app.models.user_role import UserRole
from app.schemas.role_schema import (
    RoleSchema,
    RoleAttachPermissionSchema,
    RoleAssignUserSchema,
)
from app.utils.auth import admin_required, write_audit

bp = Blueprint("roles", __name__, url_prefix="/roles")

role_schema = RoleSchema()
roles_schema = RoleSchema(many=True)
attach_permission_schema = RoleAttachPermissionSchema()
assign_user_schema = RoleAssignUserSchema()


@bp.get("")
@admin_required
def list_roles():
    return jsonify(roles_schema.dump(Role.query.all())), 200


@bp.post("")
@admin_required
def create_role():
    role = role_schema.load(request.get_json(silent=True) or {})

    try:
        db.session.add(role)
        db.session.flush()
        write_audit("create", "role", role.id, {"name": role.name})
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "role name already exists"}), 409

    return jsonify(role_schema.dump(role)), 201


@bp.get("/<int:role_id>")
@admin_required
def get_role(role_id):
    role = Role.query.get(role_id)
    if not role:
        return jsonify({"error": "role not found"}), 404
    return jsonify(role_schema.dump(role)), 200


@bp.put("/<int:role_id>")
@admin_required
def update_role(role_id):
    role = Role.query.get(role_id)
    if not role:
        return jsonify({"error": "role not found"}), 404

    payload = request.get_json(silent=True) or {}
    role_schema.load(payload, instance=role, partial=True)

    try:
        write_audit("update", "role", role.id, payload)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "role name already exists"}), 409

    return jsonify(role_schema.dump(role)), 200


@bp.delete("/<int:role_id>")
@admin_required
def delete_role(role_id):
    role = Role.query.get(role_id)
    if not role:
        return jsonify({"error": "role not found"}), 404

    db.session.delete(role)
    write_audit("delete", "role", role_id, None)
    db.session.commit()
    return jsonify({"msg": "role deleted", "id": role_id}), 200


# ----- Role <-> Permission -----

@bp.post("/<int:role_id>/permissions")
@admin_required
def attach_permission(role_id):
    role = Role.query.get(role_id)
    if not role:
        return jsonify({"error": "role not found"}), 404

    data = attach_permission_schema.load(request.get_json(silent=True) or {})
    permission_id = data["permission_id"]

    if not Permission.query.get(permission_id):
        return jsonify({"error": "permission not found"}), 404
    if RolePermission.query.filter_by(role_id=role_id, permission_id=permission_id).first():
        return jsonify({"error": "permission already attached"}), 409

    db.session.add(RolePermission(role_id=role_id, permission_id=permission_id))
    write_audit("attach_permission", "role", role_id, {"permission_id": permission_id})
    db.session.commit()
    return jsonify({"msg": "permission attached"}), 201


@bp.delete("/<int:role_id>/permissions/<int:permission_id>")
@admin_required
def detach_permission(role_id, permission_id):
    rp = RolePermission.query.filter_by(role_id=role_id, permission_id=permission_id).first()
    if not rp:
        return jsonify({"error": "mapping not found"}), 404

    db.session.delete(rp)
    write_audit("detach_permission", "role", role_id, {"permission_id": permission_id})
    db.session.commit()
    return jsonify({"msg": "permission detached"}), 200


# ----- User <-> Role -----

@bp.post("/<int:role_id>/users")
@admin_required
def assign_user(role_id):
    role = Role.query.get(role_id)
    if not role:
        return jsonify({"error": "role not found"}), 404

    data = assign_user_schema.load(request.get_json(silent=True) or {})
    user_id = data["user_id"]

    if UserRole.query.filter_by(user_id=user_id, role_id=role_id).first():
        return jsonify({"error": "user already has role"}), 409

    db.session.add(UserRole(user_id=user_id, role_id=role_id))
    write_audit("assign_role", "user", user_id, {"role_id": role_id})
    db.session.commit()
    return jsonify({"msg": "role assigned"}), 201


@bp.delete("/<int:role_id>/users/<int:user_id>")
@admin_required
def unassign_user(role_id, user_id):
    ur = UserRole.query.filter_by(user_id=user_id, role_id=role_id).first()
    if not ur:
        return jsonify({"error": "mapping not found"}), 404

    db.session.delete(ur)
    write_audit("unassign_role", "user", user_id, {"role_id": role_id})
    db.session.commit()
    return jsonify({"msg": "role unassigned"}), 200
