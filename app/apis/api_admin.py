from functools import wraps
from flask_jwt_simple import get_jwt_identity
from flask_restplus import Resource, Namespace, fields, reqparse

from auth.exceptions import ApplicationUserRoleException
from models import db
from models.application_user_role import ApplicationUserRole, Role
from models.user import User

admin_info_namespace = Namespace('admin', description='Admin Endpoint.')
success_or_not = admin_info_namespace.model('Success', {
    'status': fields.Boolean(
        required=True
    ),
    'message': fields.String(
        required=True
    )
})
user_info = admin_info_namespace.model('User', {
    'user_uid': fields.String(required=True),
    'user_name': fields.String(required=True)
})
role_info = admin_info_namespace.model('Role', {
    'role': fields.String(required=True),
    'user': fields.Nested(user_info, required=True)
})


@admin_info_namespace.route('/users')
class ApiApplicationUsers(Resource):
    @admin_info_namespace.marshal_list_with(user_info)
    def get(self):
        return User.query.all()


def check_role(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        application_id = kwargs.get('application_id')
        user_id = get_jwt_identity()
        role = db.session.query(ApplicationUserRole).filter(
            ApplicationUserRole.application_id == application_id,
            ApplicationUserRole.user_id == user_id).one_or_none()
        if role is None:
            # applications which don't have users are also accesssible as admin
            roles = db.session.query(ApplicationUserRole).filter(
                ApplicationUserRole.application_id == application_id).count()
            if roles == 0:
                pass
            else:
                raise ApplicationUserRoleException
        elif role.role != Role.admin:
            raise ApplicationUserRoleException
        return fn(*args, **kwargs)
    return wrapper


@admin_info_namespace.route('/<int:application_id>/acl')
class ApiApplicationIdACL(Resource):
    method_decorators = [check_role]

    save_acl_parser = reqparse.RequestParser()
    save_acl_parser.add_argument('uid', type=str, required=True, location='form')
    save_acl_parser.add_argument('role', type=str, required=True, location='form')

    delete_acl_parser = reqparse.RequestParser()
    delete_acl_parser.add_argument('uid', type=str, required=True, location='form')

    @admin_info_namespace.marshal_list_with(role_info)
    def get(self, application_id):
        roles = ApplicationUserRole.query.filter_by(application_id=application_id).all()
        return roles

    @admin_info_namespace.marshal_with(success_or_not)
    @admin_info_namespace.expect(save_acl_parser)
    def post(self, application_id):
        args = self.save_acl_parser.parse_args()
        uid = args['uid']
        uobj = db.session.query(User).filter(User.user_uid == uid).one_or_none()
        if uobj is None:
            return {"status": False}, 400

        roleObj = ApplicationUserRole(
            application_id=application_id,
            user_id=uobj.user_id,
            role=args['role'])
        db.session.add(roleObj)
        db.session.flush()

        # if role is added by first user, they will be admin
        roles = db.session.query(ApplicationUserRole).filter(
            ApplicationUserRole.application_id == application_id).count()
        if roles <= 1:
            sender_id = get_jwt_identity()
            if uobj.user_id != sender_id:
                adminObj = ApplicationUserRole(
                    application_id=application_id,
                    user_id=sender_id,
                    role='admin')
                db.session.add(adminObj)
                db.session.flush()
            else:
                roleObj.role = 'admin'

        db.session.commit()
        db.session.close()
        return {"status": True, "message": "Success."}, 200

    @admin_info_namespace.marshal_with(success_or_not)
    @admin_info_namespace.expect(save_acl_parser)
    def patch(self, application_id):
        args = self.save_acl_parser.parse_args()
        uid = args['uid']
        uobj = db.session.query(User).filter(User.user_uid == uid).one_or_none()
        if uobj is None:
            return {"status": False}, 400
        roleObj = db.session.query(ApplicationUserRole).filter(
            ApplicationUserRole.application_id == application_id,
            ApplicationUserRole.user_id == uobj.user_id).one()
        roleObj.role = args['role']
        db.session.commit()
        db.session.close()
        return {"status": True, "message": "Success."}, 200

    @admin_info_namespace.marshal_with(success_or_not)
    @admin_info_namespace.expect(delete_acl_parser)
    def delete(self, application_id):
        args = self.delete_acl_parser.parse_args()
        uid = args['uid']
        uobj = db.session.query(User).filter(User.user_uid == uid).one_or_none()
        if uobj is None:
            return {"status": False}, 400

        ApplicationUserRole.query.filter(
            ApplicationUserRole.application_id == application_id,
            ApplicationUserRole.user_id == uobj.user_id).delete()
        db.session.commit()
        db.session.close()
        return {"status": True, "message": "Success."}, 200
