from marshmallow import fields, validate

from app import ma, db
from app.models.notification import Notification

ALLOWED_STATUSES = ("unread", "read")


class NotificationSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Notification
        load_instance = True
        include_fk = True
        sqla_session = db.session
        dump_only = ("id", "created_at", "read_at")

    type = ma.auto_field(required=True, validate=validate.Length(min=1, max=50))
    title = ma.auto_field(required=True, validate=validate.Length(min=1, max=200))
    status = ma.auto_field(validate=validate.OneOf(ALLOWED_STATUSES))
