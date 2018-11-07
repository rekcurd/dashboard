from flask_restplus import Resource, Namespace, fields, reqparse

from models import db
from models.application_user_role import ApplicationUserRole
from models.user import User

admin_info_namespace = Namespace('admin', description='Admin Endpoint.')
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


@admin_info_namespace.route('/<int:application_id>/acl')
class ApiApplicationIdACL(Resource):
    # TODO: check admin

    add_acl_parser = reqparse.RequestParser()
    add_acl_parser.add_argument('uid', type=str, required=True, location='form')
    add_acl_parser.add_argument('role', type=str, required=True, location='form')

    delete_acl_parser = reqparse.RequestParser()
    delete_acl_parser.add_argument('uid', type=str, required=True, location='form')

    @admin_info_namespace.marshal_list_with(role_info)
    def get(self, application_id):
        roles = ApplicationUserRole.query.filter_by(application_id=application_id).all()
        return roles

    @admin_info_namespace.expect(add_acl_parser)
    def post(self, application_id):
        args = self.add_acl_parser.parse_args()
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
        db.session.commit()
        db.session.close()
        return {"status": True, "message": "Success."}, 200

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
