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
