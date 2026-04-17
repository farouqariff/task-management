from marshmallow import fields

from app import ma, db
from app.models.audit_log import AuditLog


class AuditLogSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = AuditLog
        include_fk = True
        sqla_session = db.session
        dump_only = ("id", "created_at")

    user_email = fields.String(attribute="user.email", dump_only=True)
