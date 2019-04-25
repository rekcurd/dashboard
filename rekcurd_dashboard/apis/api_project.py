from flask_jwt_simple import get_jwt_identity
from flask_restplus import Namespace, fields, Resource, reqparse, inputs

from . import api, status_model, update_kubernetes_deployment_info
from rekcurd_dashboard.utils import RekcurdDashboardException
from rekcurd_dashboard.models import db, ProjectModel, ProjectUserRoleModel, ProjectRole, KubernetesModel
from rekcurd_dashboard.apis import DatetimeToTimestamp


project_api_namespace = Namespace('projects', description='Project API Endpoint.')
success_or_not = project_api_namespace.model('Status', status_model)
project_model_params = project_api_namespace.model('Project', {
    'project_id': fields.Integer(
        readOnly=True,
        description='Project ID.'
    ),
    'display_name': fields.String(
        required=True,
        description='Project name.',
        example='Sample project.'
    ),
    'use_kubernetes': fields.Boolean(
        required=True,
        description='Do you use Kubernetes?',
        example='False'
    ),
    'description': fields.String(
        required=False,
        description='Description.',
        example='This is a sample.'
    ),
    'register_date': DatetimeToTimestamp(
        readOnly=True,
        description='Register date.'
    )
})


@project_api_namespace.route('/projects')
class ApiProjects(Resource):
    project_model_parser = reqparse.RequestParser()
    project_model_parser.add_argument('display_name', type=str, required=True, location='form', default='sample', help='Sample project.')
    project_model_parser.add_argument('use_kubernetes', type=inputs.boolean, required=True, location='form', default=False, help='Do you use Kubernetes?')
    project_model_parser.add_argument('description', type=str, required=False, location='form', help='Description.')

    @project_api_namespace.marshal_list_with(project_model_params)
    def get(self):
        """get_projects"""
        return ProjectModel.query.all()

    @project_api_namespace.marshal_with(success_or_not)
    @project_api_namespace.expect(project_model_parser)
    def post(self):
        """add_non-kube_worker"""
        args = self.project_model_parser.parse_args()
        display_name = args['display_name']
        description = args['description']
        use_kubernetes = args['use_kubernetes']

        project_model = db.session.query(ProjectModel).filter(
            ProjectModel.display_name == display_name).one_or_none()
        if project_model is None:
            project_model = ProjectModel(
                display_name=display_name, description=description, use_kubernetes=use_kubernetes)
            db.session.add(project_model)
            db.session.flush()
        else:
            raise RekcurdDashboardException("Project name is duplicated. \"{}\"".format(display_name))

        if api.dashboard_config.IS_ACTIVATE_AUTH:
            user_id = get_jwt_identity()
            project_user_role_model = ProjectUserRoleModel(
                project_id=project_model.project_id,
                user_id=user_id,
                project_role=ProjectRole.admin.name)
            db.session.add(project_user_role_model)
            db.session.flush()
        db.session.commit()
        db.session.close()
        return {"status": True, "message": "Success."}


@project_api_namespace.route('/projects/<int:project_id>')
class ApiProjectId(Resource):
    project_model_parser = reqparse.RequestParser()
    project_model_parser.add_argument('display_name', type=str, required=False, location='form', help='Sample project.')
    project_model_parser.add_argument('use_kubernetes', type=bool, required=False, location='form', help='Do you use Kubernetes?')
    project_model_parser.add_argument('description', type=str, required=False, location='form', help='Description.')

    @project_api_namespace.marshal_with(project_model_params)
    def get(self, project_id:int):
        """get_project"""
        return ProjectModel.query.filter_by(project_id=project_id).first_or_404()

    @project_api_namespace.marshal_with(success_or_not)
    @project_api_namespace.expect(project_model_parser)
    def patch(self, project_id:int):
        """update_project"""
        args = self.project_model_parser.parse_args()
        display_name = args['display_name']
        description = args['description']
        use_kubernetes = args['use_kubernetes']

        project_model = db.session.query(ProjectModel).filter(ProjectModel.project_id == project_id).first_or_404()
        is_update = False
        if display_name is not None:
            project_model.display_name = display_name
            is_update = True
        if description is not None:
            project_model.description = description
            is_update = True
        if use_kubernetes is not None:
            project_model.use_kubernetes = use_kubernetes
            is_update = True
        if is_update:
            db.session.commit()
        db.session.close()
        return {"status": True, "message": "Success."}

    @project_api_namespace.marshal_with(success_or_not)
    def put(self, project_id: int):
        """update to the latest Kubernetes deployment info."""
        kubernetes_model = KubernetesModel.query.filter_by(project_id=project_id).first()
        update_kubernetes_deployment_info(kubernetes_model)
        db.session.commit()
        db.session.close()
        return {"status": True, "message": "Success."}
