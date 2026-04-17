from datetime import datetime, timezone

from app import db


class ProjectMember(db.Model):
    __tablename__ = "project_members"
    __table_args__ = (
        db.UniqueConstraint("project_id", "user_id", name="uq_project_member"),
    )

    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey("projects.id"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    role = db.Column(db.String(20), nullable=False, default="member")
    added_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    project = db.relationship("Project", back_populates="members")
    user = db.relationship("User", back_populates="project_memberships")
