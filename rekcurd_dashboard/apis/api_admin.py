from functools import wraps
from flask_jwt_simple import get_jwt_identity
from flask_restplus import Resource, Namespace, fields, reqparse

from rekcurd_dashboard.auth import fetch_project_role, fetch_application_role, ProjectUserRoleException, ApplicationUserRoleException
from rekcurd_dashboard.models import db, UserModel, ProjectRole, ApplicationRole, ProjectUserRoleModel, ApplicationUserRoleModel
from rekcurd_dashboard.utils import RekcurdDashboardException
from . import status_model


admin_api_namespace = Namespace('admin', description='Admin API Endpoint.')
success_or_not = admin_api_namespace.model('Status', status_model)
user_info = admin_api_namespace.model('User', {
    'auth_id': fields.String(required=True),
    'user_name': fields.String(required=True)
})
role_info = admin_api_namespace.model('Role', {
    'role': fields.String(required=True),
    'user': fields.Nested(user_info, required=True)
})


def check_owner_role(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user_id = get_jwt_identity()
        project_id = kwargs.get('project_id')
        application_id = kwargs.get('application_id')
        project_user_role = fetch_project_role(user_id, project_id)
        if application_id is None:
            if project_user_role == ProjectRole.admin:
                return fn(*args, **kwargs)
            else:
                raise ProjectUserRoleException
        application_user_role = fetch_application_role(user_id, application_id)
        if project_user_role is not None and application_user_role == ApplicationRole.admin:
            return fn(*args, **kwargs)
        else:
            raise ApplicationUserRoleException
    return wrapper


@admin_api_namespace.route('/users')
class ApiUsers(Resource):
    @admin_api_namespace.marshal_list_with(user_info)
    def get(self):
        return UserModel.query.all()


@admin_api_namespace.route('/projects/<int:project_id>/acl')
class ApiProjectIdACL(Resource):
    method_decorators = [check_owner_role]

    save_acl_parser = reqparse.RequestParser()
    save_acl_parser.add_argument('uid', type=str, required=True, location='form')
    save_acl_parser.add_argument('role', type=str, required=True, location='form')

    delete_acl_parser = reqparse.RequestParser()
    delete_acl_parser.add_argument('uid', type=str, required=True, location='form')

    @admin_api_namespace.marshal_list_with(role_info)
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
            ProjectUserRoleModel.user_id == user_model.user_id).one()
        project_user_role_model.project_role = args['role']
        db.session.commit()
        db.session.close()
        return {"status": True, "message": "Success."}, 200

    @admin_api_namespace.marshal_with(success_or_not)
    @admin_api_namespace.expect(delete_acl_parser)
    def delete(self, project_id):
        args = self.delete_acl_parser.parse_args()
        uid = args['uid']
        user_model = db.session.query(UserModel).filter(UserModel.auth_id == uid).one_or_none()
        if user_model is None:
            raise RekcurdDashboardException("No user found.")

        ProjectUserRoleModel.query.filter(
            ProjectUserRoleModel.project_id == project_id,
            ProjectUserRoleModel.user_id == user_model.user_id).delete()
        db.session.commit()
        db.session.close()
        return {"status": True, "message": "Success."}, 200


@admin_api_namespace.route('/projects/<int:project_id>/applications/<int:application_id>/acl')
class ApiApplicationIdACL(Resource):
    method_decorators = [check_owner_role]

    save_acl_parser = reqparse.RequestParser()
    save_acl_parser.add_argument('uid', type=str, required=True, location='form')
    save_acl_parser.add_argument('role', type=str, required=True, location='form')

    delete_acl_parser = reqparse.RequestParser()
    delete_acl_parser.add_argument('uid', type=str, required=True, location='form')

    @admin_api_namespace.marshal_list_with(role_info)
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
                    role=ApplicationRole.admin.name)
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
                role=role)
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
        application_user_role_model = db.session.query(ApplicationUserRoleModel).filter(
            ApplicationUserRoleModel.application_id == application_id,
            ApplicationUserRoleModel.user_id == user_model.user_id).one()
        application_user_role_model.role = args['role']
        db.session.commit()
        db.session.close()
        return {"status": True, "message": "Success."}, 200

    @admin_api_namespace.marshal_with(success_or_not)
    @admin_api_namespace.expect(delete_acl_parser)
    def delete(self, project_id, application_id):
        args = self.delete_acl_parser.parse_args()
        uid = args['uid']
        user_model = db.session.query(UserModel).filter(UserModel.auth_id == uid).one_or_none()
        if user_model is None:
            raise RekcurdDashboardException("No user found.")

        ApplicationUserRoleModel.query.filter(
            ApplicationUserRoleModel.application_id == application_id,
            ApplicationUserRoleModel.user_id == user_model.user_id).delete()
        db.session.commit()
        db.session.close()
        return {"status": True, "message": "Success."}, 200
