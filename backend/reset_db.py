"""Remove all data from every table without dropping the tables.

Usage:
    cd backend
    python reset_db.py
"""
import sys

from app import create_app, db
from app.models.task_assignee import TaskAssignee
from app.models.task import Task
from app.models.project_member import ProjectMember
from app.models.project import Project
from app.models.notification import Notification
from app.models.audit_log import AuditLog
from app.models.user import User


def reset():
    db.session.query(TaskAssignee).delete()
    db.session.query(Task).delete()
    db.session.query(ProjectMember).delete()
    db.session.query(Project).delete()
    db.session.query(Notification).delete()
    db.session.query(AuditLog).delete()
    db.session.query(User).delete()
    db.session.commit()
    print("[ok] all data removed. tables are intact.")


def main():
    app = create_app()
    with app.app_context():
        reset()


if __name__ == "__main__":
    sys.exit(main())
