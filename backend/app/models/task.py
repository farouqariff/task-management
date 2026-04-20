from datetime import datetime, timezone

from app import db


class Task(db.Model):
    __tablename__ = "tasks"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="todo")
    priority = db.Column(db.String(20), nullable=False, default="low")
    project_id = db.Column(db.Integer, db.ForeignKey("projects.id"), nullable=False, index=True)
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    due_date = db.Column(db.DateTime(timezone=True), nullable=True)

    project = db.relationship("Project", back_populates="tasks")
    creator = db.relationship(
        "User",
        back_populates="tasks_created",
        foreign_keys=[created_by],
    )
    assignees = db.relationship(
        "TaskAssignee",
        back_populates="task",
        cascade="all, delete-orphan",
        lazy=True,
    )

    def has_assignee(self, user_id: int) -> bool:
        return any(a.user_id == user_id for a in self.assignees)
