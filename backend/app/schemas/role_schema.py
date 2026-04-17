from marshmallow import fields, validate

from app import ma, db
from app.models.role import Role


class RoleSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Role
        load_instance = True
        sqla_session = db.session
        dump_only = ("id", "created_at", "updated_at")

    name = ma.auto_field(required=True, validate=validate.Length(min=1, max=80))
    description = ma.auto_field(validate=validate.Length(max=255), allow_none=True)

    permissions = fields.Method("get_permissions", dump_only=True)

    def get_permissions(self, obj):
        return [rp.permission.name for rp in obj.role_permissions if rp.permission]


class RoleAttachPermissionSchema(ma.Schema):
    permission_id = fields.Integer(required=True, strict=True)


class RoleAssignUserSchema(ma.Schema):
    user_id = fields.Integer(required=True, strict=True)
