from marshmallow import fields, validate

from app import ma, db
from app.models.permission import Permission


class PermissionSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Permission
        load_instance = True
        sqla_session = db.session
        dump_only = ("id", "created_at", "updated_at")

    name = ma.auto_field(required=True, validate=validate.Length(min=1, max=100))
    description = ma.auto_field(validate=validate.Length(max=255), allow_none=True)


class PermissionGrantSchema(ma.Schema):
    user_id = fields.Integer(required=True, strict=True)
