from flask_jwt_simple import get_jwt_identity
from flask_restplus import Resource, Namespace, fields, reqparse

from rekcurd_dashboard.models import db, UserModel, ApplicationRole, ProjectUserRoleModel, ApplicationUserRoleModel
from rekcurd_dashboard.utils import RekcurdDashboardException
from . import status_model


admin_api_namespace = Namespace('admin', description='Admin API Endpoint.')
success_or_not = admin_api_namespace.model('Status', status_model)
user_info = admin_api_namespace.model('User', {
    'auth_id': fields.String(required=True),
    'user_name': fields.String(required=True)
})
project_role_info = admin_api_namespace.model('Role', {
    'project_role': fields.String(required=True),
    'user': fields.Nested(user_info, required=True)
})
application_role_info = admin_api_namespace.model('Role', {
    'application_role': fields.String(required=True),
    'user': fields.Nested(user_info, required=True)
})


@admin_api_namespace.route('/users')
class ApiUsers(Resource):
    @admin_api_namespace.marshal_list_with(user_info)
    def get(self):
        return UserModel.query.all()


@admin_api_namespace.route('/projects/<int:project_id>/acl')
class ApiProjectIdACL(Resource):
    save_acl_parser = reqparse.RequestParser()
    save_acl_parser.add_argument('uid', type=str, required=True, location='form')
    save_acl_parser.add_argument('role', type=str, required=True, location='form',
                                 choices=('admin', 'member'))

    @admin_api_namespace.marshal_list_with(project_role_info)
    def get(self, project_id):
        roles = ProjectUserRoleModel.query.filter_by(project_id=project_id).all()
        return roles

    @admin_api_namespace.marshal_with(success_or_not)
    @admin_api_namespace.expect(save_acl_parser)
    def post(self, project_id):
        args = self.save_acl_parser.parse_args()
        uid = args['uid']
        user_model = db.session.query(UserModel).filter(UserModel.auth_id == uid).one_or_none()
        if user_model is None:
            raise RekcurdDashboardException("No user found.")

        role = args['role']
        project_user_role_model = db.session.query(ProjectUserRoleModel).filter(
            ProjectUserRoleModel.project_id == project_id,
            ProjectUserRoleModel.user_id == user_model.user_id).one_or_none()
        if project_user_role_model is None:
            project_user_role_model = ProjectUserRoleModel(
                project_id=project_id,
                user_id=user_model.user_id,
                project_role=role)
            db.session.add(project_user_role_model)
            db.session.commit()
            db.session.close()
            return {"status": True, "message": "Success."}, 200
        else:
            raise RekcurdDashboardException("Already assigned.")

    @admin_api_namespace.marshal_with(success_or_not)
    @admin_api_namespace.expect(save_acl_parser)
    def patch(self, project_id):
        args = self.save_acl_parser.parse_args()
        uid = args['uid']
        user_model = db.session.query(UserModel).filter(UserModel.auth_id == uid).one_or_none()
        if user_model is None:
            raise RekcurdDashboardException("No user found.")
        project_user_role_model = db.session.query(ProjectUserRoleModel).filter(
            ProjectUserRoleModel.project_id == project_id,
            ProjectUserRoleModel.user_id == user_model.user_id).first_or_404()
        project_user_role_model.project_role = args['role']
        db.session.commit()
        db.session.close()
        return {"status": True, "message": "Success."}, 200


@admin_api_namespace.route('/projects/<int:project_id>/acl/users/<uid>')
class ApiProjectIdUserIdACL(Resource):
    @admin_api_namespace.marshal_with(success_or_not)
    def delete(self, project_id, uid):
        user_model = db.session.query(UserModel).filter(UserModel.auth_id == uid).one_or_none()
        if user_model is None:
            raise RekcurdDashboardException("No user found.")

        ProjectUserRoleModel.query.filter(
            ProjectUserRoleModel.project_id == project_id,
            ProjectUserRoleModel.user_id == user_model.user_id).delete()
        db.session.commit()
        db.session.close()
        return {"status": True, "message": "Success."}, 200


@admin_api_namespace.route('/projects/<int:project_id>/applications/<application_id>/acl')
class ApiApplicationIdACL(Resource):
    save_acl_parser = reqparse.RequestParser()
    save_acl_parser.add_argument('uid', type=str, required=True, location='form')
    save_acl_parser.add_argument('role', type=str, required=True, location='form',
                                 choices=('admin', 'editor', 'viewer'))

    @admin_api_namespace.marshal_list_with(application_role_info)
    def get(self, project_id, application_id):
        roles = ApplicationUserRoleModel.query.filter_by(application_id=application_id).all()
        return roles

    @admin_api_namespace.marshal_with(success_or_not)
    @admin_api_namespace.expect(save_acl_parser)
    def post(self, project_id, application_id):
        args = self.save_acl_parser.parse_args()
        uid = args['uid']
        user_model = db.session.query(UserModel).filter(UserModel.auth_id == uid).one_or_none()
        if user_model is None:
            raise RekcurdDashboardException("No user found.")

        role = args['role']
        # if role is added by first user, they will be owner
        roles = db.session.query(ApplicationUserRoleModel).filter(
            ApplicationUserRoleModel.application_id == application_id).count()
        if roles == 0:
            sender_id = get_jwt_identity()
            if user_model.user_id != sender_id:
                ownerObj = ApplicationUserRoleModel(
                    application_id=application_id,
                    user_id=sender_id,
                    application_role=ApplicationRole.admin.name)
                db.session.add(ownerObj)
                db.session.flush()
            else:
                role = ApplicationRole.admin.name
        application_user_role_model = db.session.query(ApplicationUserRoleModel).filter(
            ApplicationUserRoleModel.application_id == application_id,
            ApplicationUserRoleModel.user_id == user_model.user_id).one_or_none()
        if application_user_role_model is None:
            application_user_role_model = ApplicationUserRoleModel(
                application_id=application_id,
                user_id=user_model.user_id,
                application_role=role)
            db.session.add(application_user_role_model)
            db.session.commit()
            db.session.close()
            return {"status": True, "message": "Success."}, 200
        else:
            raise RekcurdDashboardException("Already assigned.")

    @admin_api_namespace.marshal_with(success_or_not)
    @admin_api_namespace.expect(save_acl_parser)
    def patch(self, project_id, application_id):
        args = self.save_acl_parser.parse_args()
        uid = args['uid']
        user_model = db.session.query(UserModel).filter(UserModel.auth_id == uid).one_or_none()
        if user_model is None:
            raise RekcurdDashboardException("No user found.")
        application_user_role_model: ApplicationUserRoleModel = db.session.query(ApplicationUserRoleModel).filter(
            ApplicationUserRoleModel.application_id == application_id,
            ApplicationUserRoleModel.user_id == user_model.user_id).first_or_404()
        application_user_role_model.application_role = args['role']
        db.session.commit()
        db.session.close()
        return {"status": True, "message": "Success."}, 200


@admin_api_namespace.route('/projects/<int:project_id>/applications/<application_id>/acl/users/<uid>')
class ApiApplicationIdUserIdACL(Resource):
    @admin_api_namespace.marshal_with(success_or_not)
    def delete(self, project_id, application_id, uid):
        user_model = db.session.query(UserModel).filter(UserModel.auth_id == uid).one_or_none()
        if user_model is None:
            raise RekcurdDashboardException("No user found.")

        ApplicationUserRoleModel.query.filter(
            ApplicationUserRoleModel.application_id == application_id,
            ApplicationUserRoleModel.user_id == user_model.user_id).delete()
        db.session.commit()
        db.session.close()
        return {"status": True, "message": "Success."}, 200
