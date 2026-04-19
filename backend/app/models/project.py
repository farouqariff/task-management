from datetime import datetime, timezone

from app import db


class Project(db.Model):
    __tablename__ = "projects"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
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

    creator = db.relationship(
        "User",
        back_populates="projects_created",
        foreign_keys=[created_by],
    )
    members = db.relationship(
        "ProjectMember",
        back_populates="project",
        cascade="all, delete-orphan",
        lazy=True,
    )
    tasks = db.relationship(
        "Task",
        back_populates="project",
        cascade="all, delete-orphan",
        lazy=True,
    )

    def has_member(self, user_id: int) -> bool:
        return any(m.user_id == user_id for m in self.members)

    def leader_ids(self) -> set:
        return {m.user_id for m in self.members if m.role == "leader"}
