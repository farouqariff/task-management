from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from sqlalchemy.exc import IntegrityError

from app import db
from app.models import User

bp = Blueprint("auth", __name__, url_prefix="/auth")

ALLOWED_ROLES = {"user", "admin"}


@bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    role = (data.get("role") or "user").strip().lower()

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400
    if role not in ALLOWED_ROLES:
        return jsonify({"error": f"role must be one of {sorted(ALLOWED_ROLES)}"}), 400

    user = User(email=email, role=role)
    user.set_password(password)

    try:
        db.session.add(user)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "email already registered"}), 409

    return jsonify({"msg": "user created", "user_id": user.id}), 201


@bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "invalid credentials"}), 401

    token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role, "email": user.email},
    )
    return jsonify({"access_token": token}), 200
