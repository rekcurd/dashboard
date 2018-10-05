from flask_restplus import Resource, Namespace, fields
from models.application_user_role import ApplicationUserRole

admin_info_namespace = Namespace('admin', description='Admin Endpoint.')
user_info = admin_info_namespace.model('User', {
    'user_uid': fields.String(required=True),
    'user_name': fields.String(required=True)
})
role_info = admin_info_namespace.model('Role', {
    'role': fields.String(required=True),
    'user': fields.Nested(user_info, required=True)
})


@admin_info_namespace.route('/<int:application_id>/acl')
class ApiApplicationIdACL(Resource):

    @admin_info_namespace.marshal_list_with(role_info)
    def get(self, application_id):
        roles = ApplicationUserRole.query.filter_by(application_id=application_id).all()
        return roles
