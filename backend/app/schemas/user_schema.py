from marshmallow import fields, validate, pre_load

from app import ma, db
from app.models.user import User


def _normalize(data):
    if not isinstance(data, dict):
        return data
    if isinstance(data.get("email"), str):
        data["email"] = data["email"].strip().lower()
    for key in ("first_name", "last_name"):
        if isinstance(data.get(key), str):
            data[key] = data[key].strip()
    return data


class UserSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = User
        load_instance = True
        sqla_session = db.session
        exclude = ("password_hash",)
        dump_only = ("id", "is_admin", "created_at", "updated_at")

    full_name = fields.String(dump_only=True)


class UserRegisterSchema(ma.Schema):
    first_name = fields.String(required=True, validate=validate.Length(min=1, max=80))
    last_name = fields.String(required=True, validate=validate.Length(min=1, max=80))
    email = fields.Email(required=True)
    password = fields.String(required=True, load_only=True, validate=validate.Length(min=6))

    @pre_load
    def normalize(self, data, **kwargs):
        return _normalize(data)


class UserLoginSchema(ma.Schema):
    email = fields.Email(required=True)
    password = fields.String(required=True, load_only=True)

    @pre_load
    def normalize(self, data, **kwargs):
        return _normalize(data)


class UserUpdateSchema(ma.Schema):
    first_name = fields.String(validate=validate.Length(min=1, max=80))
    last_name = fields.String(validate=validate.Length(min=1, max=80))
    email = fields.Email()
    password = fields.String(load_only=True, validate=validate.Length(min=6))

    @pre_load
    def normalize(self, data, **kwargs):
        return _normalize(data)


class UserAdminUpdateSchema(ma.Schema):
    """Used when admin edits another user — password change not allowed."""
    first_name = fields.String(validate=validate.Length(min=1, max=80))
    last_name = fields.String(validate=validate.Length(min=1, max=80))
    email = fields.Email()

    @pre_load
    def normalize(self, data, **kwargs):
        return _normalize(data)


class UserAdminCreateSchema(ma.Schema):
    """Used when admin creates a user — no password, backend generates one."""
    first_name = fields.String(required=True, validate=validate.Length(min=1, max=80))
    last_name = fields.String(required=True, validate=validate.Length(min=1, max=80))
    email = fields.Email(required=True)

    @pre_load
    def normalize(self, data, **kwargs):
        return _normalize(data)
