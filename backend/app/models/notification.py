from datetime import datetime, timezone

from app import db


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    type = db.Column(db.String(50), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=True)
    link = db.Column(db.String(500), nullable=True)
    status = db.Column(db.String(20), nullable=False, default="unread", index=True)
    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    read_at = db.Column(db.DateTime(timezone=True), nullable=True)

    user = db.relationship("User", back_populates="notifications")

    def mark_read(self) -> None:
        self.status = "read"
        self.read_at = datetime.now(timezone.utc)
