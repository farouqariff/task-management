import secrets
import string

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required
from flask_mail import Message
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import aliased

from app import db, mail
from app.models.user import User
from app.models.project import Project
from app.models.project_member import ProjectMember
from app.schemas.user_schema import UserSchema, UserUpdateSchema, UserAdminUpdateSchema, UserAdminCreateSchema
from app.utils.auth import current_user, admin_required, write_audit

bp = Blueprint("users", __name__, url_prefix="/users")

user_schema = UserSchema()
users_schema = UserSchema(many=True)
admin_create_schema = UserAdminCreateSchema()
update_schema = UserUpdateSchema()
admin_update_schema = UserAdminUpdateSchema()


@bp.post("")
@admin_required
def create_user():
    data = admin_create_schema.load(request.get_json(silent=True) or {})

    alphabet = string.ascii_letters + string.digits
    temp_password = ''.join(secrets.choice(alphabet) for _ in range(12))

    user = User(
        first_name=data["first_name"],
        last_name=data["last_name"],
        email=data["email"],
        is_admin=False,
    )
    user.set_password(temp_password)

    try:
        db.session.add(user)
        db.session.flush()

        personal = Project(name="Personal", created_by=user.id, is_personal=True)
        db.session.add(personal)
        db.session.flush()
        db.session.add(ProjectMember(project_id=personal.id, user_id=user.id, role="leader"))

        write_audit("create", "user", user.id, {"email": user.email}, resource_label=user.email)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "email already registered"}), 409

    msg = Message(
        subject="Your Tally Account Has Been Created",
        sender=current_app.config["MAIL_USERNAME"],
        recipients=[user.email],
        body=(
            f"Hi {user.first_name},\n\n"
            f"An administrator has created a Tally account for you.\n\n"
            f"Your temporary password is: {temp_password}\n\n"
            f"Please log in at {current_app.config['FRONTEND_URL']} and change your password immediately.\n\n"
            f"Do not share this password with anyone."
        ),
    )
    mail.send(msg)

    return jsonify(user_schema.dump(user)), 201


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


@bp.get("/me/personal-project")
@jwt_required()
def get_personal_project():
    me_ = current_user()
    if not me_:
        return jsonify({"error": "user not found"}), 404
    project = Project.query.filter_by(created_by=me_.id, is_personal=True).first()
    if not project:
        return jsonify({"error": "personal project not found"}), 404
    return jsonify({"id": project.id, "name": project.name}), 200


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

    # Admin editing someone else: no password change allowed
    if me_.is_admin and me_.id != user_id:
        data = admin_update_schema.load(request.get_json(silent=True) or {})
    else:
        data = update_schema.load(request.get_json(silent=True) or {})

    if "password" in data:
        user.set_password(data.pop("password"))
    for key, value in data.items():
        setattr(user, key, value)

    try:
        write_audit("update", "user", user.id, {k: v for k, v in data.items() if k != "password"}, resource_label=user.email)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "email already registered"}), 409

    return jsonify(user_schema.dump(user)), 200


@bp.delete("/<int:user_id>")
@admin_required
def delete_user(user_id):
    me_ = current_user()
    if me_ and me_.id == user_id:
        return jsonify({"error": "You cannot delete your own account."}), 403

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "user not found"}), 404

    # Block deletion if user is the sole leader of any project
    OtherLeader = aliased(ProjectMember, name="other_leader")
    subq = (
        db.session.query(OtherLeader.id)
        .filter(
            OtherLeader.project_id == ProjectMember.project_id,
            OtherLeader.role == "leader",
            OtherLeader.user_id != user_id,
        )
        .correlate(ProjectMember)
        .exists()
    )
    sole_leader_of = [
        name for (name,) in (
            db.session.query(Project.name)
            .join(ProjectMember, ProjectMember.project_id == Project.id)
            .filter(
                ProjectMember.user_id == user_id,
                ProjectMember.role == "leader",
                ~subq,
            )
            .all()
        )
    ]

    if sole_leader_of:
        return jsonify({
            "error": f"User is the sole leader of: {', '.join(sole_leader_of)}. Reassign the leader before deleting."
        }), 409

    deleted_email = user.email
    db.session.delete(user)
    write_audit("delete", "user", user_id, None, resource_label=deleted_email)
    db.session.commit()
    return jsonify({"msg": "user deleted", "id": user_id}), 200
