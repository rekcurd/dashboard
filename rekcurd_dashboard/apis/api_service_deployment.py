import datetime
import math

from flask_restplus import Namespace, fields, Resource, reqparse, inputs

from . import status_model, apply_rekcurd_to_kubernetes, load_kubernetes_deployment_info
from rekcurd_dashboard.core import RekcurdDashboardClient
from rekcurd_dashboard.models import db, ApplicationModel, ServiceModel
from rekcurd_dashboard.protobuf import rekcurd_pb2


service_deployment_api_namespace = Namespace('service_deployments', description='Service Deployment API Endpoint.')
success_or_not = service_deployment_api_namespace.model('Success', status_model)
service_deployment_params = service_deployment_api_namespace.model('Deployment', {
    'application_name': fields.String(
        readOnly=True,
        description='Application name.'
    ),
    'service_id': fields.String(
        readOnly=True,
        description='Service ID.'
    ),
    'display_name': fields.String(
        required=True,
        description='Display name.',
        example='dev-001'
    ),
    'description': fields.String(
        required=False,
        description='Description.',
        example='This is a sample.'
    ),
    'service_level': fields.String(
        required=True,
        description='Service level. [development/beta/staging/sandbox/production]',
        example='development'
    ),
    'version': fields.String(
        required=False,
        description='Rekcurd gRPC spec version. Default is the latest version.',
        example='v1'
    ),
    'insecure_host': fields.String(
        required=False,
        description='Rekcurd server insecure host. Default is "[::]".',
        example='[::]'
    ),
    'insecure_port': fields.Integer(
        required=False,
        description='Rekcurd server insecure port. Default is "5000".',
        example=5000
    ),
    'replicas_default': fields.Integer(
        required=False,
        description='Number of pod at beginning. Default is "1".',
        example=1
    ),
    'replicas_minimum': fields.Integer(
        required=False,
        description='Minimum number of pod for auto-scaling. Default is "1".',
        example=1
    ),
    'replicas_maximum': fields.Integer(
        required=False,
        description='Maximum number of pod for auto-scaling. Default is "1".',
        example=1
    ),
    'autoscale_cpu_threshold': fields.Integer(
        required=False,
        description='Threshold of CPU usage for auto-scaling. Default "80".',
        example=80
    ),
    'policy_max_surge': fields.Integer(
        required=False,
        description='Maximum number of surged pod when updating. Default "ceil(0.25 * <replicas_default>)".',
        example=1
    ),
    'policy_max_unavailable': fields.Integer(
        required=False,
        description='Maximum number of unavailable pod when updating. Default "floor(0.25 * <replicas_default>)".',
        example=0
    ),
    'policy_wait_seconds': fields.Integer(
        required=False,
        description='Booting second of your service. You MUST specify the accurate number. '
                    'This value become a safety net for your production services. Default is "300".',
        example=300
    ),
    'container_image': fields.String(
        required=True,
        description='Location of your service container image.',
        example='centos:centos7'
    ),
    'service_model_assignment': fields.Integer(
        required=True,
        description='Model ID which is assigned to the service.',
        example=1
    ),
    'service_git_url': fields.String(
        required=False,
        description='URL of your git repository. If you use "rekcurd/rekcurd:tagname" image, '
                    'this field is necessary.',
        example='https://github.com/rekcurd/rekcurd-example.git'
    ),
    'service_git_branch': fields.String(
        required=False,
        description='Name of your git branch. If you use "rekcurd/rekcurd:tagname" image, '
                    'this field is necessary.',
        example='master'
    ),
    'service_boot_script': fields.String(
        required=False,
        description='Booting script for your service. If you use "rekcurd/rekcurd:tagname" image, '
                    'this field is necessary.',
        example='start.sh'
    ),
    'resource_request_cpu': fields.Float(
        required=True,
        description='CPU reservation for your service.',
        example=1.0
    ),
    'resource_request_memory': fields.String(
        required=True,
        description='Memory reservation for your service.',
        example='512Mi'
    ),
    'resource_limit_cpu': fields.Float(
        required=False,
        description='Upper limit of CPU reservation. Default is "resource_request_cpu".',
        example=1.0
    ),
    'resource_limit_memory': fields.String(
        required=False,
        description='Upper limit of memory reservation. Default is "resource_request_memory".',
        example='512Mi'
    ),
    'commit_message': fields.String(
        required=False,
        description='Commit message.',
        example='Initial deployment for "development" env. Default is a commit date.'
    )
})


@service_deployment_api_namespace.route(
    '/projects/<int:project_id>/applications/<application_id>/single_service_registration')
class ApiSingleServiceRegistration(Resource):
    """
    Registration for non-Kubernetes service.
    """
    single_worker_parser = reqparse.RequestParser()
    single_worker_parser.add_argument(
        'display_name', location='form', type=str, required=True, help='Display name. Must be unique.')
    single_worker_parser.add_argument(
        'description', location='form', type=str, required=False, help='Description.')
    single_worker_parser.add_argument(
        'version', location='form', type=str, required=False,
        choices=('v0', 'v1', 'v2'),
        default=rekcurd_pb2.DESCRIPTOR.GetOptions().Extensions[rekcurd_pb2.rekcurd_grpc_proto_version],
        help='Rekcurd gRPC spec version. Default is the latest version.')
    single_worker_parser.add_argument(
        'service_level', location='form', type=str, required=True,
        choices=('development','beta','staging','sandbox','production'),
        help='Service level. [development/beta/staging/sandbox/production].')
    single_worker_parser.add_argument(
        'service_model_assignment', location='form', type=int, required=True,
        help='Model ID which is assigned to the service.')
    single_worker_parser.add_argument(
        'insecure_host', location='form', type=str, default="localhost", required=False,
        help='Rekcurd server host. Default is "localhost".')
    single_worker_parser.add_argument(
        'insecure_port', location='form', type=int, default=5000, required=False,
        help='Rekcurd server port. Default is "5000".')

    @service_deployment_api_namespace.marshal_with(success_or_not)
    @service_deployment_api_namespace.expect(single_worker_parser)
    def post(self, project_id: int, application_id: str):
        """Add non-Kubenetes service."""
        args = self.single_worker_parser.parse_args()
        display_name = args["display_name"]
        description = args["description"]
        service_level = args["service_level"]
        version = args["version"] or rekcurd_pb2.DESCRIPTOR.GetOptions().Extensions[rekcurd_pb2.rekcurd_grpc_proto_version]
        service_model_assignment = args["service_model_assignment"]
        insecure_host = args["insecure_host"]
        insecure_port = args["insecure_port"]

        application_model: ApplicationModel = db.session.query(ApplicationModel).filter(
            ApplicationModel.application_id == application_id).first_or_404()
        rekcurd_dashboard_client = RekcurdDashboardClient(
            host=insecure_host, port=insecure_port, application_name=application_model.application_name,
            service_level=service_level, rekcurd_grpc_version=version)
        service_info = rekcurd_dashboard_client.run_service_info()
        service_id = service_info["service_name"]  # TODO: renaming

        service_model = ServiceModel(
            service_id=service_id, application_id=application_id, display_name=display_name,
            description=description, service_level=service_level, version=version,
            model_id=service_model_assignment, insecure_host=insecure_host,
            insecure_port=insecure_port
        )
        db.session.add(service_model)
        db.session.commit()
        db.session.close()
        return {"status": True, "message": "Success."}


@service_deployment_api_namespace.route('/projects/<int:project_id>/applications/<application_id>/service_deployment')
class ApiServiceDeployment(Resource):
    service_deployment_parser = reqparse.RequestParser()
    service_deployment_parser.add_argument(
        'display_name', location='form', type=str, required=True,
        help='Display name.')
    service_deployment_parser.add_argument(
        'description', location='form', type=str, required=False,
        help='Description.')
    service_deployment_parser.add_argument(
        'version', location='form', type=str, required=False,
        choices=('v0', 'v1', 'v2'),
        default=rekcurd_pb2.DESCRIPTOR.GetOptions().Extensions[rekcurd_pb2.rekcurd_grpc_proto_version],
        help='Rekcurd gRPC spec version. Default is the latest version.')
    service_deployment_parser.add_argument(
        'service_level', location='form', type=str, required=True,
        choices=('development','beta','staging','sandbox','production'),
        help='Service level. [development/beta/staging/sandbox/production].')
    service_deployment_parser.add_argument(
        'insecure_host', location='form', type=str, default="[::]", required=False,
        help='Rekcurd server insecure host. Default is "[::]".')
    service_deployment_parser.add_argument(
        'insecure_port', location='form', type=int, default=5000, required=False,
        help='Rekcurd server insecure port. Default is "5000".')
    service_deployment_parser.add_argument(
        'replicas_default', location='form', type=int, default=1, required=False,
        help='Number of pod at beginning. Default is "1".')
    service_deployment_parser.add_argument(
        'replicas_minimum', location='form', type=int, default=1, required=False,
        help='Minimum number of pod for auto-scaling. Default is "1".')
    service_deployment_parser.add_argument(
        'replicas_maximum', location='form', type=int, default=1, required=False,
        help='Maximum number of pod for auto-scaling. Default is "1".')
    service_deployment_parser.add_argument(
        'autoscale_cpu_threshold', location='form', type=int, default=80, required=False,
        help='Threshold of CPU usage for auto-scaling. Default "80".')
    service_deployment_parser.add_argument(
        'policy_max_surge', location='form', type=int, required=False,
        help='Maximum number of surged pod when updating. Default "ceil(0.25 * <replicas_default>)".')
    service_deployment_parser.add_argument(
        'policy_max_unavailable', location='form', type=int, required=False,
        help='Maximum number of unavailable pod when updating. Default "floor(0.25 * <replicas_default>)".')
    service_deployment_parser.add_argument(
        'policy_wait_seconds', location='form', type=int, default=300, required=False,
        help='Booting second of your service. You MUST specify the accurate number. '
             'This value become a safety net for your production services. Default is "300".')
    service_deployment_parser.add_argument(
        'container_image', location='form', type=str, required=True,
        help='Location of your service container image.')
    service_deployment_parser.add_argument(
        'service_model_assignment', location='form', type=int, required=True,
        help='Model ID which is assigned to the service.')
    service_deployment_parser.add_argument(
        'service_git_url', location='form', type=str, default="", required=False,
        help='URL of your git repository. If you use "rekcurd/rekcurd:tagname" image, this field is necessary.')
    service_deployment_parser.add_argument(
        'service_git_branch', location='form', type=str, default="", required=False,
        help='Name of your git branch. If you use "rekcurd/rekcurd:tagname" image, this field is necessary.')
    service_deployment_parser.add_argument(
        'service_boot_script', location='form', type=str, default="", required=False,
        help='Booting script for your service. If you use "rekcurd/rekcurd:tagname" image, this field is necessary.')
    service_deployment_parser.add_argument(
        'resource_request_cpu', location='form', type=float, default=1.0, required=True,
        help='CPU reservation for your service.')
    service_deployment_parser.add_argument(
        'resource_request_memory', location='form', type=str, default='512Mi', required=True,
        help='Memory reservation for your service.')
    service_deployment_parser.add_argument(
        'resource_limit_cpu', location='form', type=float, required=False,
        help='Upper limit of CPU reservation. Default is "resource_request_cpu".')
    service_deployment_parser.add_argument(
        'resource_limit_memory', location='form', type=str, required=False,
        help='Upper limit of memory reservation. Default is "resource_request_memory".')
    service_deployment_parser.add_argument(
        'debug_mode', location='form', type=inputs.boolean, default=False, required=False,
        help='Debug mode.')

    @service_deployment_api_namespace.marshal_with(success_or_not)
    @service_deployment_api_namespace.expect(service_deployment_parser)
    def post(self, project_id: int, application_id: str):
        """Add Kubenetes service."""
        args = self.service_deployment_parser.parse_args()
        args['commit_message'] = "Update at {0:%Y%m%d%H%M%S}".format(datetime.datetime.utcnow())
        if args['policy_max_surge'] is None:
            args['policy_max_surge'] = math.ceil(0.25 * args['replicas_default'])
        if args['policy_max_unavailable'] is None:
            args['policy_max_unavailable'] = math.floor(0.25 * args['replicas_default'])
        if args['resource_limit_cpu'] is None:
            args['resource_limit_cpu'] = args['resource_request_cpu']
        if args['resource_limit_memory'] is None:
            args['resource_limit_memory'] = args['resource_request_memory']
        apply_rekcurd_to_kubernetes(project_id=project_id, application_id=application_id, **args)
        db.session.commit()
        db.session.close()
        return {"status": True, "message": "Success."}


@service_deployment_api_namespace.route('/projects/<int:project_id>/applications/<application_id>/service_deployment/<service_id>')
class ApiServiceIdDeployment(Resource):
    patch_parser = reqparse.RequestParser()
    patch_parser.add_argument(
        'display_name', location='form', type=str, required=True,
        help='Display name.')
    patch_parser.add_argument(
        'description', location='form', type=str, required=False,
        help='Description.')
    patch_parser.add_argument(
        'version', location='form', type=str, required=True,
        choices=('v0', 'v1', 'v2'),
        default=rekcurd_pb2.DESCRIPTOR.GetOptions().Extensions[rekcurd_pb2.rekcurd_grpc_proto_version],
        help='Rekcurd gRPC spec version. Default is the latest version.')
    patch_parser.add_argument(
        'service_level', location='form', type=str, required=True,
        choices=('development','beta','staging','sandbox','production'),
        help='Service level. [development/beta/staging/sandbox/production].')
    patch_parser.add_argument(
        'insecure_host', location='form', type=str, required=True,
        help='Rekcurd server insecure host. Default is "[::]".')
    patch_parser.add_argument(
        'insecure_port', location='form', type=int, required=True,
        help='Rekcurd server insecure port. Default is "5000".')
    patch_parser.add_argument(
        'replicas_default', location='form', type=int, required=True,
        help='Number of pod at beginning. Default is "1".')
    patch_parser.add_argument(
        'replicas_minimum', location='form', type=int, required=True,
        help='Minimum number of pod for auto-scaling. Default is "1".')
    patch_parser.add_argument(
        'replicas_maximum', location='form', type=int, required=True,
        help='Maximum number of pod for auto-scaling. Default is "1".')
    patch_parser.add_argument(
        'autoscale_cpu_threshold', location='form', type=int, required=True,
        help='Threshold of CPU usage for auto-scaling. Default "80".')
    patch_parser.add_argument(
        'policy_max_surge', location='form', type=int, required=True,
        help='Maximum number of surged pod when updating. Default "ceil(0.25 * <replicas_default>)".')
    patch_parser.add_argument(
        'policy_max_unavailable', location='form', type=int, required=True,
        help='Maximum number of unavailable pod when updating. Default "floor(0.25 * <replicas_default>)".')
    patch_parser.add_argument(
        'policy_wait_seconds', location='form', type=int, required=True,
        help='Booting second of your service. You MUST specify the accurate number. '
             'This value become a safety net for your production services. Default is "300".')
    patch_parser.add_argument(
        'container_image', location='form', type=str, required=True,
        help='Location of your service container image.')
    patch_parser.add_argument(
        'service_model_assignment', location='form', type=int, required=True,
        help='Model ID which is assigned to the service.')
    patch_parser.add_argument(
        'service_git_url', location='form', type=str, required=True,
        help='URL of your git repository. If you use "rekcurd/rekcurd:tagname" image, this field is necessary.')
    patch_parser.add_argument(
        'service_git_branch', location='form', type=str, required=True,
        help='Name of your git branch. If you use "rekcurd/rekcurd:tagname" image, this field is necessary.')
    patch_parser.add_argument(
        'service_boot_script', location='form', type=str, required=True,
        help='Booting script for your service. If you use "rekcurd/rekcurd:tagname" image, this field is necessary.')
    patch_parser.add_argument(
        'resource_request_cpu', location='form', type=float, required=True,
        help='CPU reservation for your service.')
    patch_parser.add_argument(
        'resource_request_memory', location='form', type=str, required=True,
        help='Memory reservation for your service.')
    patch_parser.add_argument(
        'resource_limit_cpu', location='form', type=float, required=True,
        help='Upper limit of CPU reservation. Default is "resource_request_cpu".')
    patch_parser.add_argument(
        'resource_limit_memory', location='form', type=str, required=True,
        help='Upper limit of memory reservation. Default is "resource_request_memory".')
    patch_parser.add_argument(
        'debug_mode', location='form', type=inputs.boolean, default=False, required=False,
        help='Debug mode.')

    @service_deployment_api_namespace.marshal_with(service_deployment_params)
    def get(self, project_id: int, application_id: str, service_id: str):
        """Get Kubernetes deployment info."""
        deployment_info = load_kubernetes_deployment_info(project_id, application_id, service_id)
        service_model: ServiceModel = db.session.query(ServiceModel).filter(
            ServiceModel.service_id == service_id).first_or_404()
        deployment_info["display_name"] = service_model.display_name
        deployment_info["description"] = service_model.description
        return deployment_info

    @service_deployment_api_namespace.marshal_with(success_or_not)
    def put(self, project_id: int, application_id: str, service_id: str):
        """Update Kubernetes deployment info."""
        deployment_info = load_kubernetes_deployment_info(project_id, application_id, service_id)
        service_model: ServiceModel = db.session.query(ServiceModel).filter(
            ServiceModel.service_id == service_id).first_or_404()
        is_updated = False
        if service_model.version != deployment_info["version"]:
            is_updated = True
            service_model.version = deployment_info["version"]
        if service_model.model_id != deployment_info["service_model_assignment"]:
            is_updated = True
            service_model.model_id = deployment_info["service_model_assignment"]
        if service_model.insecure_host != deployment_info["insecure_host"]:
            is_updated = True
            service_model.insecure_host = deployment_info["insecure_host"]
        if service_model.insecure_port != deployment_info["insecure_port"]:
            is_updated = True
            service_model.insecure_port = deployment_info["insecure_port"]
        if is_updated:
            db.session.commit()
        db.session.close()
        return {"status": True, "message": "Success."}

    @service_deployment_api_namespace.marshal_with(success_or_not)
    @service_deployment_api_namespace.expect(patch_parser)
    def patch(self, project_id: int, application_id: str, service_id: str):
        """Rolling update of Kubernetes deployment configurations."""
        args = self.patch_parser.parse_args()
        args['commit_message'] = "Update at {0:%Y%m%d%H%M%S}".format(datetime.datetime.utcnow())
        apply_rekcurd_to_kubernetes(
            project_id=project_id, application_id=application_id, service_id=service_id, **args)

        service_model: ServiceModel = db.session.query(ServiceModel).filter(
            ServiceModel.service_id == service_id).first_or_404()
        is_updated = False
        if service_model.display_name != args["display_name"]:
            is_updated = True
            service_model.version = args["display_name"]
        if service_model.description != args["description"]:
            is_updated = True
            service_model.version = args["description"]
        if service_model.version != args["version"]:
            is_updated = True
            service_model.version = args["version"]
        if service_model.model_id != args["service_model_assignment"]:
            is_updated = True
            service_model.model_id = args["service_model_assignment"]
        if service_model.insecure_host != args["insecure_host"]:
            is_updated = True
            service_model.insecure_host = args["insecure_host"]
        if service_model.insecure_port != args["insecure_port"]:
            is_updated = True
            service_model.insecure_port = args["insecure_port"]
        if is_updated:
            db.session.commit()
        db.session.close()
        return {"status": True, "message": "Success."}
