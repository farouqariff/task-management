from datetime import datetime, timezone

from app import db


class TaskAssignee(db.Model):
    __tablename__ = "task_assignees"
    __table_args__ = (
        db.UniqueConstraint("task_id", "user_id", name="uq_task_assignee"),
    )

    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey("tasks.id"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    assigned_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    task = db.relationship("Task", back_populates="assignees")
    user = db.relationship("User", back_populates="task_assignments")
