from flask_restplus import Namespace, fields, Resource, reqparse

from . import status_model, load_secret, apply_secret


GIT_SSH_DIR = "/root/.ssh"
GIT_ID_RSA = "git_id_rsa"
GIT_CONFIG = "config"

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
        string_data = load_secret(project_id, application_id, service_level)

        GIT_ID_RSA_TEMPLATE = "-----BEGIN RSA PRIVATE KEY-----\n" \
                              "YOUR-RSA-PRIVATE-KEY\n" \
                              "-----END RSA PRIVATE KEY-----"
        GIT_CONFIG_TEMPLATE = "Host git.private.com\n" \
                              "  User git\n" \
                              "  Port 22\n" \
                              "  HostName git.private.com\n" \
                              "  IdentityFile /root/.ssh/git_id_rsa\n" \
                              "  StrictHostKeyChecking no"
        response_body = dict()
        response_body[GIT_ID_RSA] = string_data[GIT_ID_RSA] if GIT_ID_RSA in string_data and string_data[GIT_ID_RSA] \
            else GIT_ID_RSA_TEMPLATE
        response_body[GIT_CONFIG] = string_data[GIT_CONFIG] if GIT_CONFIG in string_data and string_data[GIT_CONFIG] \
            else GIT_CONFIG_TEMPLATE
        return response_body

    @kubernetes_secret_api_namespace.marshal_with(success_or_not)
    @kubernetes_secret_api_namespace.expect(git_key_parser)
    def post(self, project_id: int, application_id: str):
        """Save git key."""
        args = self.git_key_parser.parse_args()
        service_level = args["service_level"]
        string_data = load_secret(project_id, application_id, service_level)
        string_data[GIT_ID_RSA] = args[GIT_ID_RSA]
        string_data[GIT_CONFIG] = args[GIT_CONFIG]
        apply_secret(project_id, application_id, service_level, is_creation_mode=True, string_data=string_data)
        return {"status": True, "message": "Success."}

    @kubernetes_secret_api_namespace.marshal_with(success_or_not)
    @kubernetes_secret_api_namespace.expect(git_key_parser)
    def patch(self, project_id: int, application_id: str):
        """Update git key."""
        args = self.git_key_parser.parse_args()
        service_level = args["service_level"]
        string_data = load_secret(project_id, application_id, service_level)
        string_data[GIT_ID_RSA] = args[GIT_ID_RSA]
        string_data[GIT_CONFIG] = args[GIT_CONFIG]
        apply_secret(project_id, application_id, service_level, is_creation_mode=False, string_data=string_data)
        return {"status": True, "message": "Success."}


@kubernetes_secret_api_namespace.route('/projects/<int:project_id>/applications/<application_id>/service_levels/<service_level>/git_key')
class ApiGitKeyDelete(Resource):
    @kubernetes_secret_api_namespace.marshal_with(success_or_not)
    def delete(self, project_id: int, application_id: str, service_level: str):
        """Delete git key."""
        string_data = load_secret(project_id, application_id, service_level)
        if string_data:
            string_data[GIT_ID_RSA] = ""
            string_data[GIT_CONFIG] = ""
            apply_secret(project_id, application_id, service_level, is_creation_mode=False, string_data=string_data)
        return {"status": True, "message": "Success."}
