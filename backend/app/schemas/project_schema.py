from marshmallow import fields, validate

from app import ma, db
from app.models.project import Project
from app.models.project_member import ProjectMember

ALLOWED_MEMBER_ROLES = ("leader", "member")


class ProjectMemberSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = ProjectMember
        include_fk = True
        sqla_session = db.session
        dump_only = ("id", "added_at")

    user_email = fields.String(attribute="user.email", dump_only=True)
    user_full_name = fields.String(attribute="user.full_name", dump_only=True)


class ProjectSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Project
        load_instance = True
        include_fk = True
        sqla_session = db.session
        dump_only = ("id", "created_by", "created_at", "updated_at", "is_personal")

    name = ma.auto_field(required=True, validate=validate.Length(min=1, max=200))

    creator_email = fields.Function(lambda obj: obj.creator.email if obj.creator else None, dump_only=True)
    members = fields.Nested(ProjectMemberSchema, many=True, dump_only=True)
    permissions = fields.Method("get_permissions", dump_only=True)

    def get_permissions(self, project):
        from app.utils.auth import current_user, can_manage_project
        user = current_user()
        if not user:
            return None
        return {
            "can_edit": can_manage_project(user, project),
            "can_delete": user.is_admin or project.created_by == user.id,
        }


class ProjectMemberCreateSchema(ma.Schema):
    user_id = fields.Integer(required=True, strict=True)
    role = fields.String(load_default="member", validate=validate.OneOf(ALLOWED_MEMBER_ROLES))
