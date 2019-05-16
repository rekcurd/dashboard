from flask_restplus import Namespace, fields, Resource, reqparse
from werkzeug.exceptions import NotFound

from . import (
    status_model, load_secret, apply_secret, delete_secret,
    GIT_SECRET_PREFIX, GIT_ID_RSA, GIT_CONFIG
)
from rekcurd_dashboard.utils import RekcurdDashboardException


kubernetes_secret_api_namespace = Namespace('kubernetes_secret', description='Kubernetes Secret API Endpoint.')
success_or_not = kubernetes_secret_api_namespace.model('Success', status_model)
git_key_params = kubernetes_secret_api_namespace.model('Git Key', {
    'git_id_rsa': fields.String(
        readOnly=True,
        description='"$HOME/.ssh/git_id_rsa"'
    ),
    'config': fields.String(
        readOnly=True,
        description='"$HOME/.ssh/config"'
    )
})


@kubernetes_secret_api_namespace.route('/projects/<int:project_id>/applications/<application_id>/git_key')
class ApiGitKey(Resource):
    get_parser = reqparse.RequestParser()
    get_parser.add_argument(
        'service_level', location='args', type=str, required=True,
        choices=('development', 'beta', 'staging', 'sandbox', 'production'),
        help='Service level. [development/beta/staging/sandbox/production].')

    git_key_parser = reqparse.RequestParser()
    git_key_parser.add_argument(GIT_ID_RSA, location='form', type=str, required=True, help='"$HOME/.ssh/git_id_rsa"')
    git_key_parser.add_argument(GIT_CONFIG, location='form', type=str, required=True, help='"$HOME/.ssh/config"')
    git_key_parser.add_argument(
        'service_level', location='form', type=str, required=True,
        choices=('development','beta','staging','sandbox','production'),
        help='Service level. [development/beta/staging/sandbox/production].')

    @kubernetes_secret_api_namespace.marshal_with(git_key_params)
    @kubernetes_secret_api_namespace.expect(get_parser)
    def get(self, project_id: int, application_id: str):
        """Get git key."""
        args = self.get_parser.parse_args()
        service_level = args["service_level"]
        string_data = load_secret(project_id, application_id, service_level, GIT_SECRET_PREFIX)

        response_body = dict()
        if GIT_ID_RSA in string_data and GIT_CONFIG in string_data:
            response_body[GIT_ID_RSA] = string_data[GIT_ID_RSA]
            response_body[GIT_CONFIG] = string_data[GIT_CONFIG]
        else:
            raise RekcurdDashboardException("No git key secret found.")
        return response_body

    @kubernetes_secret_api_namespace.marshal_with(success_or_not)
    @kubernetes_secret_api_namespace.expect(git_key_parser)
    def post(self, project_id: int, application_id: str):
        """Save git key."""
        args = self.git_key_parser.parse_args()
        service_level = args["service_level"]
        try:
            string_data = load_secret(project_id, application_id, service_level, GIT_SECRET_PREFIX)
        except NotFound:
            raise RekcurdDashboardException("No Kubernetes is registered")
        except:
            string_data = dict()
        if GIT_ID_RSA in string_data or GIT_CONFIG in string_data:
            raise RekcurdDashboardException("Git key secret already exist.")
        string_data[GIT_ID_RSA] = args[GIT_ID_RSA]
        string_data[GIT_CONFIG] = args[GIT_CONFIG]
        apply_secret(project_id, application_id, service_level, string_data, GIT_SECRET_PREFIX)
        return {"status": True, "message": "Success."}

    @kubernetes_secret_api_namespace.marshal_with(success_or_not)
    @kubernetes_secret_api_namespace.expect(git_key_parser)
    def patch(self, project_id: int, application_id: str):
        """Update git key."""
        args = self.git_key_parser.parse_args()
        service_level = args["service_level"]
        string_data = load_secret(project_id, application_id, service_level, GIT_SECRET_PREFIX)
        string_data[GIT_ID_RSA] = args[GIT_ID_RSA]
        string_data[GIT_CONFIG] = args[GIT_CONFIG]
        apply_secret(project_id, application_id, service_level, string_data, GIT_SECRET_PREFIX)
        return {"status": True, "message": "Success."}


@kubernetes_secret_api_namespace.route('/projects/<int:project_id>/applications/<application_id>/service_levels/<service_level>/git_key')
class ApiGitKeyDelete(Resource):
    @kubernetes_secret_api_namespace.marshal_with(success_or_not)
    def delete(self, project_id: int, application_id: str, service_level: str):
        """Delete git key."""
        delete_secret(project_id, application_id, service_level, GIT_SECRET_PREFIX)
        return {"status": True, "message": "Success."}
