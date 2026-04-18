from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from sqlalchemy.exc import IntegrityError

from app import db
from app.models.user import User
from app.models.role import Role
from app.models.user_role import UserRole
from app.schemas.user_schema import UserRegisterSchema, UserLoginSchema
from app.utils.auth import write_audit

bp = Blueprint("auth", __name__, url_prefix="/auth")

register_schema = UserRegisterSchema()
login_schema = UserLoginSchema()


@bp.post("/register")
def register():
    data = register_schema.load(request.get_json(silent=True) or {})

    user = User(
        first_name=data["first_name"],
        last_name=data["last_name"],
        email=data["email"],
        is_admin=False,
    )
    user.set_password(data["password"])

    try:
        db.session.add(user)
        db.session.flush()

        default_role = Role.query.filter_by(name="user").first()
        if default_role:
            db.session.add(UserRole(user_id=user.id, role_id=default_role.id))

        write_audit("create", "user", user.id, {"email": user.email}, actor_id=user.id)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "email already registered"}), 409

    return jsonify({"msg": "user created", "user_id": user.id}), 201


@bp.post("/login")
def login():
    data = login_schema.load(request.get_json(silent=True) or {})

    user = User.query.filter_by(email=data["email"]).first()
    if not user or not user.check_password(data["password"]):
        return jsonify({"error": "invalid credentials"}), 401

    token = create_access_token(
        identity=str(user.id),
        additional_claims={"email": user.email, "is_admin": user.is_admin},
    )
    return jsonify({"access_token": token, "user": user.to_dict()}), 200
