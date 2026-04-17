from app import ma
from marshmallow import fields, validates, ValidationError
from app.models.task import Task

ALLOWED_STATUSES = {"pending", "in_progress", "completed"}
ALLOWED_PRIORITIES = {"low", "medium", "high"}


class TaskSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Task
        load_instance = True
        include_fk = True

    # format datetime for frontend
    created_at = fields.DateTime(dump_only=True, format="iso")
    due_date = fields.DateTime(allow_none=True, format="iso")

    # nested safe field
    user_email = fields.String(attribute="user.email", dump_only=True)

    @validates("status")
    def validate_status(self, value):
        if value not in ALLOWED_STATUSES:
            raise ValidationError(f"status must be one of {sorted(ALLOWED_STATUSES)}")

    @validates("priority")
    def validate_priority(self, value):
        if value not in ALLOWED_PRIORITIES:
            raise ValidationError(f"priority must be one of {sorted(ALLOWED_PRIORITIES)}")