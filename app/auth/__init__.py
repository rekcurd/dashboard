import traceback
from functools import wraps
from flask import jsonify, request, abort
from flask_jwt_simple import JWTManager, create_jwt, get_jwt_identity, jwt_required
from jwt.exceptions import PyJWTError
from flask_jwt_simple.exceptions import InvalidHeaderError, NoAuthorizationError

from app import logger
from auth.ldap import LdapAuthenticator
from auth.exceptions import ApplicationUserRoleException
from models import db
from models.user import User
from models.application import Application
from models.application_user_role import ApplicationUserRole, Role
from utils.env_loader import config


class Auth(object):
    __enabled = False

    @staticmethod
    def auth_required(fn):
        def check_role(user_id, application_id, method):
            role = db.session.query(ApplicationUserRole).filter(
                ApplicationUserRole.application_id == application_id,
                ApplicationUserRole.user_id == user_id).one_or_none()
            if role is None:
                # applications which don't have users are also accesssible as owner
                roles = db.session.query(ApplicationUserRole).filter(
                    ApplicationUserRole.application_id == application_id).count()
                if roles == 0:
                    return True
                return False
            if method == 'GET':
                return True
            elif role.role == Role.editor or role.role == Role.owner:
                    return True
            return False

        @wraps(fn)
        def wrapper(*args, **kwargs):
            if Auth.__enabled and request.path.startswith('/api/') and not request.path.startswith('/api/settings') and not request.path.startswith('/api/kubernetes/dump'):
                @jwt_required
                def run():
                    application_id = kwargs.get('application_id')
                    if application_id is not None:
                        user_id = get_jwt_identity()
                        if not check_role(user_id, application_id, request.method):
                            raise ApplicationUserRoleException
                    return fn(*args, **kwargs)
                return run()
            else:
                return fn(*args, **kwargs)
        return wrapper

    @staticmethod
    def enabled():
        return Auth.__enabled

    def __init__(self, app=None):
        if app is not None:
            self.init_app(app)

    def init_app(self, app, api, **kwargs):
        Auth.__enabled = True
        JWTManager(app)

        auth_conf = config['auth']
        app.config['JWT_SECRET_KEY'] = auth_conf['secret']

        if 'ldap' in auth_conf:
            authenticator = LdapAuthenticator(auth_conf['ldap'])

        # Add endpoints
        @app.route('/api/login', methods=['POST'])
        def login():
            params = request.get_json()
            username = params.get('username', None)
            password = params.get('password', None)
            user_info = authenticator.auth_user(username, password)
            if user_info is not None:
                user_id = self.user(user_info)
                ret = {'jwt': create_jwt(identity=user_id)}
                return jsonify(ret), 200
            else:
                return jsonify({'message': 'Authentication failed'}), 401

        @app.route('/api/credential', methods=['GET'])
        @jwt_required
        def credential():
            user_id = get_jwt_identity()
            uobj = db.session.query(User).filter(User.user_id == user_id).one_or_none()
            if uobj is None:
                abort(404)
            application_roles = uobj.applications
            applications = [{'application_id': ar.application_id, 'role': ar.role.name} for ar in application_roles]
            # applications which don't have users are also accesssible as owner
            application_ids = db.session.query(ApplicationUserRole.application_id).distinct().all()
            ids = [application_id for application_id, in application_ids]
            public_applications = db.session.query(Application).filter(~Application.application_id.in_(ids)).all()
            applications += [
                {'application_id': app.application_id, 'role': Role.owner.name} for app in public_applications]

            return jsonify({'user': uobj.serialize, 'applications': applications}), 200

        # Add error handlers
        @api.errorhandler(NoAuthorizationError)
        @api.errorhandler(InvalidHeaderError)
        @api.errorhandler(PyJWTError)
        @api.errorhandler(ApplicationUserRoleException)
        def authorization_error_handler(error):
            logger.error(error)
            logger.error(traceback.format_exc())
            return {'message': 'Authorization failed'}, 401

    def user(self, user_info):
        uobj = db.session.query(User).filter(User.user_uid == user_info['uid']).one_or_none()
        if uobj is not None:
            return uobj.user_id

        uobj = User(user_uid=user_info['uid'],
                    user_name=user_info['name'])
        db.session.add(uobj)
        db.session.flush()
        db.session.commit()
        user_id = uobj.user_id
        db.session.close()
        return user_id


auth = Auth()
