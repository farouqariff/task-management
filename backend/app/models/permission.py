from datetime import datetime, timezone

from app import db


class Permission(db.Model):
    __tablename__ = "permissions"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False, index=True)
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

    role_permissions = db.relationship(
        "RolePermission",
        back_populates="permission",
        cascade="all, delete-orphan",
        lazy=True,
    )
    user_permissions = db.relationship(
        "UserPermission",
        back_populates="permission",
        cascade="all, delete-orphan",
        lazy=True,
    )
