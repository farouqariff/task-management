"""Seed the database with the initial admin user.

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
from app.models.project import Project
from app.models.project_member import ProjectMember


def seed_admin_user():
    email = os.getenv("ADMIN_EMAIL", "admin@example.com").strip().lower()
    password = os.getenv("ADMIN_PASSWORD", "ChangeMe123!")
    first_name = os.getenv("ADMIN_FIRST_NAME", "Admin")
    last_name = os.getenv("ADMIN_LAST_NAME", "User")

    existing = User.query.filter_by(email=email).first()
    if existing:
        print(f"[skip] admin user already exists: {email}")
        if not Project.query.filter_by(created_by=existing.id, is_personal=True).first():
            personal = Project(name="Personal", created_by=existing.id, is_personal=True)
            db.session.add(personal)
            db.session.flush()
            db.session.add(ProjectMember(project_id=personal.id, user_id=existing.id, role="leader"))
            db.session.commit()
            print(f"[ok] personal project created for existing admin: {email}")
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

    personal = Project(name="Personal", created_by=admin.id, is_personal=True)
    db.session.add(personal)
    db.session.flush()
    db.session.add(ProjectMember(project_id=personal.id, user_id=admin.id, role="leader"))

    db.session.commit()
    print(f"[ok] admin user created: {email} (password from env or default)")


def main():
    app = create_app()
    with app.app_context():
        print("[step] seed admin user...")
        seed_admin_user()
    print("done.")


if __name__ == "__main__":
    sys.exit(main())
