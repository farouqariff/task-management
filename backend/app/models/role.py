from datetime import datetime, timezone

from app import db


class Role(db.Model):
    __tablename__ = "roles"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), unique=True, nullable=False, index=True)
    description = db.Column(db.String(255), nullable=True)
    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user_roles = db.relationship(
        "UserRole",
        back_populates="role",
        cascade="all, delete-orphan",
        lazy=True,
    )
    role_permissions = db.relationship(
        "RolePermission",
        back_populates="role",
        cascade="all, delete-orphan",
        lazy=True,
    )
