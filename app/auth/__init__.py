import traceback
from functools import wraps
from flask import jsonify, request, abort
from flask_jwt_simple import JWTManager, create_jwt, get_jwt_identity, jwt_required
from jwt.exceptions import PyJWTError
from flask_jwt_simple.exceptions import InvalidHeaderError, NoAuthorizationError

from app import logger
from auth.ldap import LdapAuthenticator
from models import db
from models.user import User
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
            if Auth.enabled and request.path.startswith('/api/') and not request.path.startswith('/api/settings'):
                @jwt_required
                def run():
                    return fn(*args, **kwargs)
                return run()
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
            return jsonify(uobj.serialize), 200

        # Add error handlers
        @api.errorhandler(NoAuthorizationError)
        @api.errorhandler(InvalidHeaderError)
        @api.errorhandler(PyJWTError)
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
