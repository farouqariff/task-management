from app import db
from datetime import datetime, timezone

class Task(db.Model):
    __tablename__ = "tasks"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="pending")
    priority = db.Column(db.String(20), nullable=False, default="low")
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )
    due_date = db.Column(db.DateTime(timezone=True), nullable=True)
    project_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)

    user = db.relationship("User", backref="tasks")
    project = db.relationship("Project", backref="tasks")