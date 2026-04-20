from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy.exc import IntegrityError

from app import db
from app.models.user import User
from app.models.project import Project
from app.models.project_member import ProjectMember
from app.schemas.user_schema import UserSchema, UserRegisterSchema, UserUpdateSchema, UserAdminUpdateSchema
from app.utils.auth import current_user, admin_required, write_audit

bp = Blueprint("users", __name__, url_prefix="/users")

user_schema = UserSchema()
users_schema = UserSchema(many=True)
register_schema = UserRegisterSchema()
update_schema = UserUpdateSchema()
admin_update_schema = UserAdminUpdateSchema()


@bp.post("")
@admin_required
def create_user():
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

        write_audit("create", "user", user.id, {"email": user.email}, resource_label=user.email)
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "email already registered"}), 409

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
    leader_memberships = ProjectMember.query.filter_by(user_id=user_id, role="leader").all()
    sole_leader_of = []
    for membership in leader_memberships:
        other_leaders = ProjectMember.query.filter(
            ProjectMember.project_id == membership.project_id,
            ProjectMember.role == "leader",
            ProjectMember.user_id != user_id,
        ).count()
        if other_leaders == 0:
            project = Project.query.get(membership.project_id)
            sole_leader_of.append(project.name if project else f"project #{membership.project_id}")

    if sole_leader_of:
        return jsonify({
            "error": f"User is the sole leader of: {', '.join(sole_leader_of)}. Reassign the leader before deleting."
        }), 409

    deleted_email = user.email
    db.session.delete(user)
    write_audit("delete", "user", user_id, None, resource_label=deleted_email)
    db.session.commit()
    return jsonify({"msg": "user deleted", "id": user_id}), 200
