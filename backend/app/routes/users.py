from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy.exc import IntegrityError

from app import db
from app.models.user import User
from app.schemas.user_schema import UserSchema, UserUpdateSchema
from app.utils.auth import current_user, admin_required, write_audit

bp = Blueprint("users", __name__, url_prefix="/users")

user_schema = UserSchema()
users_schema = UserSchema(many=True)
update_schema = UserUpdateSchema()


@bp.get("")
@jwt_required()
def list_users():
    me_ = current_user()
    search = request.args.get("search", "").strip()
    if not search and not me_.is_admin:
        return jsonify({"error": "admin only"}), 403
    query = User.query
    if search:
        query = query.filter(User.email.ilike(f"%{search}%"))
    users = query.order_by(User.id.asc()).all()
    return jsonify(users_schema.dump(users)), 200


@bp.get("/me")
@jwt_required()
def me():
    user = current_user()
    if not user:
        return jsonify({"error": "user not found"}), 404
    return jsonify(user_schema.dump(user)), 200


@bp.get("/<int:user_id>")
@jwt_required()
def get_user(user_id):
    me_ = current_user()
    if not me_:
        return jsonify({"error": "user not found"}), 404
    if not me_.is_admin and me_.id != user_id:
        return jsonify({"error": "forbidden"}), 403

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "user not found"}), 404
    return jsonify(user_schema.dump(user)), 200


@bp.put("/<int:user_id>")
@jwt_required()
def update_user(user_id):
    me_ = current_user()
    if not me_:
        return jsonify({"error": "user not found"}), 404
    if not me_.is_admin and me_.id != user_id:
        return jsonify({"error": "forbidden"}), 403

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "user not found"}), 404

    data = update_schema.load(request.get_json(silent=True) or {})

    if "password" in data:
        user.set_password(data.pop("password"))
    for key, value in data.items():
        setattr(user, key, value)

    try:
        write_audit("update", "user", user.id, {k: v for k, v in data.items() if k != "password"})
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "email already registered"}), 409

    return jsonify(user_schema.dump(user)), 200


@bp.delete("/<int:user_id>")
@admin_required
def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "user not found"}), 404
    db.session.delete(user)
    write_audit("delete", "user", user_id, None)
    db.session.commit()
    return jsonify({"msg": "user deleted", "id": user_id}), 200
