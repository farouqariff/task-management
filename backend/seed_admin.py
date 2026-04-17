"""Seed the database with the initial admin user, default roles, and baseline permissions.

Usage:
    cd backend
    python seed_admin.py

Environment overrides (optional):
    ADMIN_EMAIL       — admin email (default: admin@example.com)
    ADMIN_PASSWORD    — admin password (default: ChangeMe123!)
    ADMIN_FIRST_NAME  — admin first name (default: Admin)
    ADMIN_LAST_NAME   — admin last name (default: User)
"""
import os
import sys

from app import create_app, db
from app.models.user import User
from app.models.role import Role
from app.models.permission import Permission
from app.models.user_role import UserRole
from app.models.role_permission import RolePermission

DEFAULT_PERMISSIONS = [
    ("project.create", "Create new projects"),
    ("project.update", "Update projects"),
    ("project.delete", "Delete projects"),
    ("project.view_all", "View all projects system-wide"),
    ("task.create", "Create tasks"),
    ("task.update", "Update tasks"),
    ("task.delete", "Delete tasks"),
    ("task.view_all", "View all tasks system-wide"),
    ("user.manage", "Manage users (create/update/delete)"),
    ("role.manage", "Manage roles and permissions"),
    ("audit.view", "View audit logs"),
]

DEFAULT_ROLES = {
    "admin": "System administrator",
    "user": "Standard user — default role for new registrations",
    "leader": "Project leader — can manage project members and tasks",
}


def upsert_permissions():
    existing = {p.name for p in Permission.query.all()}
    for name, description in DEFAULT_PERMISSIONS:
        if name not in existing:
            db.session.add(Permission(name=name, description=description))
    db.session.commit()


def upsert_roles():
    existing = {r.name for r in Role.query.all()}
    for name, description in DEFAULT_ROLES.items():
        if name not in existing:
            db.session.add(Role(name=name, description=description))
    db.session.commit()


def attach_all_permissions_to(role_name: str):
    role = Role.query.filter_by(name=role_name).first()
    if not role:
        return
    existing = {rp.permission_id for rp in role.role_permissions}
    for perm in Permission.query.all():
        if perm.id not in existing:
            db.session.add(RolePermission(role_id=role.id, permission_id=perm.id))
    db.session.commit()


def seed_admin_user():
    email = os.getenv("ADMIN_EMAIL", "admin@example.com").strip().lower()
    password = os.getenv("ADMIN_PASSWORD", "ChangeMe123!")
    first_name = os.getenv("ADMIN_FIRST_NAME", "Admin")
    last_name = os.getenv("ADMIN_LAST_NAME", "User")

    if User.query.filter_by(email=email).first():
        print(f"[skip] admin user already exists: {email}")
        return

    admin = User(
        first_name=first_name,
        last_name=last_name,
        email=email,
        is_admin=True,
    )
    admin.set_password(password)
    db.session.add(admin)
    db.session.flush()

    admin_role = Role.query.filter_by(name="admin").first()
    if admin_role:
        db.session.add(UserRole(user_id=admin.id, role_id=admin_role.id))

    db.session.commit()
    print(f"[ok] admin user created: {email} (password from env or default)")


def main():
    app = create_app()
    with app.app_context():
        print("[step] ensure permissions exist...")
        upsert_permissions()
        print("[step] ensure roles exist...")
        upsert_roles()
        print("[step] grant all permissions to admin role...")
        attach_all_permissions_to("admin")
        print("[step] seed admin user...")
        seed_admin_user()
    print("done.")


if __name__ == "__main__":
    sys.exit(main())
