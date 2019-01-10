# coding: utf-8


import traceback

from functools import wraps
from flask import jsonify, request, abort
from flask_jwt_simple import JWTManager, create_jwt, get_jwt_identity, jwt_required
from jwt.exceptions import PyJWTError
from flask_jwt_simple.exceptions import InvalidHeaderError, NoAuthorizationError

from .ldap import LdapAuthenticator
from .exceptions import ApplicationUserRoleException
from .authenticator import EmptyAuthenticator
from drucker_dashboard.models import db, User, Application, ApplicationUserRole, Role


class Auth(object):
    def __init__(self):
        self.__enabled = False
        self.authenticator = EmptyAuthenticator()
        self.logger = None

    def is_enabled(self):
        return self.__enabled

    def init_app(self, app, api, auth_conf, logger):
        JWTManager(app)
        self.logger = logger

        if auth_conf is None:
            self.__enabled = False
            self.authenticator = EmptyAuthenticator()
        else:
            self.__enabled = True
            app.config['JWT_SECRET_KEY'] = auth_conf['secret']
            if 'ldap' in auth_conf:
                self.authenticator = LdapAuthenticator(auth_conf['ldap'], logger)

        # Add endpoints
        @app.route('/api/login', methods=['POST'])
        def login():
            params = request.get_json()
            username = params.get('username', None)
            password = params.get('password', None)
            user_info = self.authenticator.auth_user(username, password)
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

        @api.errorhandler(NoAuthorizationError)
        @api.errorhandler(InvalidHeaderError)
        @api.errorhandler(PyJWTError)
        @api.errorhandler(ApplicationUserRoleException)
        def authorization_error_handler(error):
            self.logger.error(error)
            self.logger.error(traceback.format_exc())
            return {'message': 'Authorization failed'}, 401

    def user(self, user_info):
        uobj = db.session.query(User).filter(User.auth_id == user_info['uid']).one_or_none()
        if uobj is not None:
            return uobj.user_id

        uobj = User(auth_id=user_info['uid'],
                    user_name=user_info['name'])
        db.session.add(uobj)
        db.session.flush()
        db.session.commit()
        user_id = uobj.user_id
        db.session.close()
        return user_id


auth = Auth()


def fetch_role(user_id, application_id):
    role = db.session.query(ApplicationUserRole).filter(
        ApplicationUserRole.application_id == application_id,
        ApplicationUserRole.user_id == user_id).one_or_none()
    if role is None:
        # applications which don't have users are also accesssible as owner
        roles = db.session.query(ApplicationUserRole).filter(
            ApplicationUserRole.application_id == application_id).count()
        if roles == 0:
            return Role.owner
        else:
            return None
    else:
        return role.role


def auth_required(fn):
    def check_role(user_id, application_id, method):
        role = fetch_role(user_id, application_id)
        if role is None:
            return False
        if method == 'GET':
            return True
        elif role == Role.editor or role == Role.owner:
                return True
        return False

    @wraps(fn)
    def wrapper(*args, **kwargs):
        if auth.is_enabled() and request.path.startswith('/api/') and not request.path.startswith('/api/settings') and not request.path.startswith('/api/kubernetes/dump'):
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
