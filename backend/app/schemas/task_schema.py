from marshmallow import fields, validate

from app import ma, db
from app.models.task import Task
from app.models.task_assignee import TaskAssignee

ALLOWED_STATUSES = ("todo", "completed")
ALLOWED_PRIORITIES = ("low", "medium", "high")


class TaskAssigneeSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = TaskAssignee
        include_fk = True
        sqla_session = db.session
        dump_only = ("id", "assigned_at")

    user_email = fields.String(attribute="user.email", dump_only=True)
    user_full_name = fields.String(attribute="user.full_name", dump_only=True)


class TaskSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Task
        load_instance = True
        include_fk = True
        sqla_session = db.session
        dump_only = ("id", "created_by", "created_at", "updated_at")

    status = ma.auto_field(validate=validate.OneOf(ALLOWED_STATUSES))
    priority = ma.auto_field(validate=validate.OneOf(ALLOWED_PRIORITIES))
    due_date = fields.Date(allow_none=True, format="iso")

    creator_email = fields.String(attribute="creator.email", dump_only=True)
    project_name = fields.String(attribute="project.name", dump_only=True)
    assignees = fields.Nested(TaskAssigneeSchema, many=True, dump_only=True)


class TaskAssigneeUpdateSchema(ma.Schema):
    """Limited schema used when an assignee updates a task they don't manage."""
    status = fields.String(validate=validate.OneOf(ALLOWED_STATUSES))
    priority = fields.String(validate=validate.OneOf(ALLOWED_PRIORITIES))


class TaskAssigneeCreateSchema(ma.Schema):
    user_id = fields.Integer(required=True, strict=True)
