import secrets
from datetime import datetime, timedelta, timezone

from app import db


class PasswordResetToken(db.Model):
    __tablename__ = "password_reset_tokens"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    token = db.Column(db.String(100), unique=True, nullable=False, index=True)
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc)
    )

    user = db.relationship(
        "User", backref=db.backref("reset_tokens", cascade="all, delete-orphan")
    )

    @staticmethod
    def generate(user_id: int) -> "PasswordResetToken":
        PasswordResetToken.query.filter_by(user_id=user_id).delete()
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
        return PasswordResetToken(user_id=user_id, token=token, expires_at=expires_at)

    def is_expired(self) -> bool:
        expires = self.expires_at
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        return datetime.now(timezone.utc) > expires
