from datetime import datetime, timezone

from app import db


class UserPermission(db.Model):
    __tablename__ = "user_permissions"
    __table_args__ = (
        db.UniqueConstraint("user_id", "permission_id", name="uq_user_permission"),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    permission_id = db.Column(db.Integer, db.ForeignKey("permissions.id"), nullable=False, index=True)
    assigned_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    user = db.relationship("User", back_populates="user_permissions")
    permission = db.relationship("Permission", back_populates="user_permissions")
