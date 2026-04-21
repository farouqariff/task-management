from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token
from flask_mail import Message
from sqlalchemy.exc import IntegrityError

from app import db, mail
from app.models.user import User
from app.models.project import Project
from app.models.project_member import ProjectMember
from app.models.password_reset_token import PasswordResetToken
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

        personal = Project(name="Personal", created_by=user.id, is_personal=True)
        db.session.add(personal)
        db.session.flush()
        db.session.add(ProjectMember(project_id=personal.id, user_id=user.id, role="leader"))

        write_audit("create", "user", user.id, {"email": user.email}, actor_id=user.id, resource_label=user.email)
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


@bp.post("/forgot-password")
def forgot_password():
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    if not email:
        return jsonify({"error": "Email is required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "No account found with that email"}), 404

    reset_token = PasswordResetToken.generate(user.id)
    db.session.add(reset_token)
    db.session.commit()

    reset_link = f"{current_app.config['FRONTEND_URL']}/new-password/{reset_token.token}"
    msg = Message(
        subject="Reset Your Password — Tally",
        sender=current_app.config["MAIL_USERNAME"],
        recipients=[user.email],
        body=(
            f"Hi {user.first_name},\n\n"
            f"Click the link below to reset your password. This link expires in 1 hour.\n\n"
            f"{reset_link}\n\n"
            f"If you didn't request this, you can safely ignore this email."
        ),
    )
    mail.send(msg)

    return jsonify({"msg": "Reset link sent"}), 200


@bp.post("/reset-password")
def reset_password():
    data = request.get_json(silent=True) or {}
    token_str = data.get("token", "")
    new_password = data.get("password", "")

    if not token_str or not new_password:
        return jsonify({"error": "Token and password are required"}), 400
    if len(new_password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    token = PasswordResetToken.query.filter_by(token=token_str).first()
    if not token:
        return jsonify({"error": "Invalid or expired reset link"}), 400
    if token.is_expired():
        db.session.delete(token)
        db.session.commit()
        return jsonify({"error": "Reset link has expired. Please request a new one."}), 400

    user = User.query.get(token.user_id)
    user.set_password(new_password)
    db.session.delete(token)
    db.session.commit()

    return jsonify({"msg": "Password updated successfully"}), 200
