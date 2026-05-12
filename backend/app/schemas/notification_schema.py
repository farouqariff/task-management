from datetime import timezone as tz
from marshmallow import fields, validate

from app import ma, db
from app.models.notification import Notification

ALLOWED_STATUSES = ("unread", "read")


def _utc_isoformat(dt):
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=tz.utc)
    return dt.isoformat()


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
    created_at = fields.Method("_dump_created_at", dump_only=True)
    read_at = fields.Method("_dump_read_at", dump_only=True)

    def _dump_created_at(self, obj):
        return _utc_isoformat(obj.created_at)

    def _dump_read_at(self, obj):
        return _utc_isoformat(obj.read_at)
