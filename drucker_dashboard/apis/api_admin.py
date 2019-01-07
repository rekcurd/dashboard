from functools import wraps
from flask_jwt_simple import get_jwt_identity
from flask_restplus import Resource, Namespace, fields, reqparse

from drucker_dashboard.auth import fetch_role, ApplicationUserRoleException
from drucker_dashboard.models import db, ApplicationUserRole, Role, User


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
    'auth_id': fields.String(required=True),
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


def check_owner_role(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user_id = get_jwt_identity()
        application_id = kwargs.get('application_id')
        role = fetch_role(application_id, user_id)
        if role is not None and role == Role.owner:
            return fn(*args, **kwargs)
        else:
            raise ApplicationUserRoleException
    return wrapper


@admin_info_namespace.route('/<int:application_id>/acl')
class ApiApplicationIdACL(Resource):
    method_decorators = [check_owner_role]

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
        uobj = db.session.query(User).filter(User.auth_id == uid).one_or_none()
        if uobj is None:
            return {"status": False}, 400

        role = args['role']
        # if role is added by first user, they will be owner
        roles = db.session.query(ApplicationUserRole).filter(
            ApplicationUserRole.application_id == application_id).count()
        if roles == 0:
            sender_id = get_jwt_identity()
            if uobj.user_id != sender_id:
                ownerObj = ApplicationUserRole(
                    application_id=application_id,
                    user_id=sender_id,
                    role=Role.owner.name)
                db.session.add(ownerObj)
                db.session.flush()
            else:
                role = Role.owner.name
        try:
            roleObj = db.session.query(ApplicationUserRole).filter(
                ApplicationUserRole.application_id == application_id,
                ApplicationUserRole.user_id == uobj.user_id).one_or_none()
            if roleObj is None:
                roleObj = ApplicationUserRole(
                    application_id=application_id,
                    user_id=uobj.user_id,
                    role=role)
                db.session.add(roleObj)
                db.session.flush()
                db.session.commit()
                db.session.close()
                return {"status": True, "message": "Success."}, 200
            else:
                return {"status": False, "message": "Already exist."}, 400
        except Exception:
            return {"status": False}, 400

    @admin_info_namespace.marshal_with(success_or_not)
    @admin_info_namespace.expect(save_acl_parser)
    def patch(self, application_id):
        args = self.save_acl_parser.parse_args()
        uid = args['uid']
        uobj = db.session.query(User).filter(User.auth_id == uid).one_or_none()
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
        uobj = db.session.query(User).filter(User.auth_id == uid).one_or_none()
        if uobj is None:
            return {"status": False}, 400

        ApplicationUserRole.query.filter(
            ApplicationUserRole.application_id == application_id,
            ApplicationUserRole.user_id == uobj.user_id).delete()
        db.session.commit()
        db.session.close()
        return {"status": True, "message": "Success."}, 200
