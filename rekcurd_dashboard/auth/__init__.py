# coding: utf-8


import traceback

from functools import wraps
from flask import jsonify, request, abort
from flask_jwt_simple import JWTManager, create_jwt, get_jwt_identity, jwt_required
from jwt.exceptions import PyJWTError
from flask_jwt_simple.exceptions import InvalidHeaderError, NoAuthorizationError

from .ldap import LdapAuthenticator
from rekcurd_dashboard.utils.exceptions import ProjectUserRoleException, ApplicationUserRoleException
from .authenticator import EmptyAuthenticator
from rekcurd_dashboard.models import (
    db, ApplicationModel, UserModel, ProjectUserRoleModel, ProjectRole, ApplicationUserRoleModel, ApplicationRole
)


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
            user_model: UserModel = db.session.query(UserModel).filter(UserModel.user_id == user_id).one_or_none()
            if user_model is None:
                abort(404)

            project_roles = user_model.project_roles
            projects = [{'project_id': pr.project_id, 'project_role': pr.project_role.name} for pr in project_roles]
            application_roles = user_model.application_roles
            applications = [{'application_id': ar.application_id, 'application_role': ar.application_role.name}
                            for ar in application_roles]
            # applications which don't have users are also accesssible as admin
            application_ids = db.session.query(ApplicationUserRoleModel.application_id).distinct().all()
            ids = [application_id for application_id, in application_ids]
            public_applications = db.session.query(ApplicationModel).filter(
                ~ApplicationModel.application_id.in_(ids)).all()
            applications += [
                {'application_id': application.application_id, 'role': ApplicationRole.admin.name}
                for application in public_applications]

            return jsonify({'user': user_model.serialize, 'projects': projects, 'applications': applications}), 200

        @api.errorhandler(NoAuthorizationError)
        @api.errorhandler(InvalidHeaderError)
        @api.errorhandler(PyJWTError)
        @api.errorhandler(ApplicationUserRoleException)
        def authorization_error_handler(error):
            self.logger.error(error)
            self.logger.error(traceback.format_exc())
            return {'message': 'Authorization failed'}, 401

    def user(self, user_info):
        uobj = db.session.query(UserModel).filter(UserModel.auth_id == user_info['uid']).one_or_none()
        if uobj is not None:
            return uobj.user_id

        uobj = UserModel(auth_id=user_info['uid'],
                    user_name=user_info['name'])
        db.session.add(uobj)
        db.session.flush()
        db.session.commit()
        user_id = uobj.user_id
        db.session.close()
        return user_id


auth = Auth()


def fetch_project_role(user_id, project_id):
    role: ProjectUserRoleModel = db.session.query(ProjectUserRoleModel).filter(
        ProjectUserRoleModel.project_id == project_id,
        ProjectUserRoleModel.user_id == user_id).one_or_none()
    if role is None:
        return None
    else:
        return role.project_role


def fetch_application_role(user_id, application_id):
    role: ApplicationUserRoleModel = db.session.query(ApplicationUserRoleModel).filter(
        ApplicationUserRoleModel.application_id == application_id,
        ApplicationUserRoleModel.user_id == user_id).one_or_none()
    if role is None:
        # applications which don't have users are also accesssible as owner
        roles = db.session.query(ApplicationUserRoleModel).filter(
            ApplicationUserRoleModel.application_id == application_id).count()
        if roles == 0:
            return ApplicationRole.admin
        else:
            return ApplicationRole.viewer
    else:
        return role.application_role


def auth_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not auth.is_enabled() or request.path.startswith('/doc/') or request.path.startswith('/api/settings'):
            return fn(*args, **kwargs)
        else:
            @jwt_required
            def run():
                project_id = kwargs.get('project_id')
                if project_id is None:
                    return fn(*args, **kwargs)
                user_id = get_jwt_identity()
                project_user_role = fetch_project_role(user_id, project_id)
                if project_user_role is None:
                    raise ProjectUserRoleException("ProjectUserRoleException")
                application_id = kwargs.get('application_id')
                if application_id is None:
                    if request.method != 'GET' and project_user_role == ProjectRole.member:
                        raise ProjectUserRoleException("ProjectUserRoleException")
                    else:
                        return fn(*args, **kwargs)

                application_user_role = fetch_application_role(user_id, application_id)
                if request.method != 'GET' and application_user_role == ApplicationRole.viewer:
                    raise ApplicationUserRoleException("ApplicationUserRoleException")
                else:
                    return fn(*args, **kwargs)
            return run()
    return wrapper
