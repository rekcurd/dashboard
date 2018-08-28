import traceback
from functools import wraps
from flask import jsonify, request
from flask_jwt_simple import JWTManager, create_jwt, get_jwt_identity, jwt_required
from jwt.exceptions import PyJWTError
from flask_jwt_simple.exceptions import InvalidHeaderError, NoAuthorizationError
from auth.ldap import LdapAuthenticator
from app import logger
from utils.env_loader import config


class Auth(object):
    enabled = False

    def __init__(self, app=None):
        if app is not None:
            self.init_app(app)

    @staticmethod
    def auth_required(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            if Auth.enabled and request.path.startswith('/api/') and \
                    not request.path.startswith('/api/settings'):
                return jwt_required(fn(*args, **kwargs))
            else:
                return fn(*args, **kwargs)
        return wrapper

    def init_app(self, app, api, **kwargs):
        Auth.enabled = True
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
            user = authenticator.auth_user(username, password)
            if user is not None:
                ret = {'jwt': create_jwt(identity=user)}
                return jsonify(ret), 200
            else:
                return jsonify({'message': 'Authentication failed'}), 401

        @app.route('/api/credential', methods=['GET'])
        @jwt_required
        def credential():
            user = get_jwt_identity()
            return jsonify({'user': user}), 200

        # Add error handlers
        @api.errorhandler(NoAuthorizationError)
        @api.errorhandler(InvalidHeaderError)
        @api.errorhandler(PyJWTError)
        def authorization_error_handler(error):
            logger.error(error)
            logger.error(traceback.format_exc())
            return {'message': 'Authorization failed'}, 401


auth = Auth()
