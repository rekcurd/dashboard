from flask_restplus import Namespace, fields, Resource, reqparse

from . import status_model, load_istio_routing, apply_new_route_weight
from rekcurd_dashboard.models import db, KubernetesModel, ApplicationModel, ServiceModel
from rekcurd_dashboard.utils import RekcurdDashboardException


service_routing_api_namespace = Namespace('service_routings', description='Service Routing API Endpoint.')
success_or_not = service_routing_api_namespace.model('Success', status_model)
service_weight_params = service_routing_api_namespace.model('Weight', {
    'display_name': fields.String(
        readOnly=True,
        description='Service name.'
    ),
    'service_id': fields.String(
        readOnly=True,
        description='Service ID.'
    ),
    'service_weight': fields.Integer(
        readOnly=True,
        description='Service weight.'
    )
})
service_routing_params = service_routing_api_namespace.model('Routing', {
    'application_name': fields.String(
        readOnly=True,
        description='Application name.'
    ),
    'service_level': fields.String(
        readOnly=True,
        description='Service level. [development/beta/staging/sandbox/production]',
        example='development'
    ),
    'service_weights': fields.List(
        fields.Nested(service_weight_params),
        readOnly=True,
        description='Service weights.'
    )
})
service_weight_expect = service_routing_api_namespace.model('Weight', {
    'service_id': fields.String(
        required=True,
        description='Service ID.'
    ),
    'service_weight': fields.Integer(
        required=True,
        description='Service weight.'
    )
})
service_routing_expect = service_routing_api_namespace.model('Routing', {
    'service_level': fields.String(
        required=True,
        description='Service level. [development/beta/staging/sandbox/production]',
        example='development'
    ),
    'service_weights': fields.List(
        fields.Nested(service_weight_expect),
        required=True,
        description='Service weights.'
    )
})


@service_routing_api_namespace.route('/projects/<int:project_id>/applications/<application_id>/service_routing')
class ApiServiceRouting(Resource):
    get_parser = reqparse.RequestParser()
    get_parser.add_argument(
        'service_level', location='args', type=str, required=True,
        choices=('development', 'beta', 'staging', 'sandbox', 'production'),
        help='Service level. [development/beta/staging/sandbox/production].')

    service_routing_parser = reqparse.RequestParser()
    service_routing_parser.add_argument(
        'service_level', type=str, required=True,
        choices=('development','beta','staging','sandbox','production'),
        help='Service level. [development/beta/staging/sandbox/production].')
    service_routing_parser.add_argument(
        'service_weights', type=dict, action='append', required=True,
        help='Service weights.')

    @service_routing_api_namespace.marshal_with(service_routing_params)
    @service_routing_api_namespace.expect(get_parser)
    def get(self, project_id: int, application_id: str):
        """Get routing info."""
        args = self.get_parser.parse_args()
        service_level = args["service_level"]
        kubernetes_model: KubernetesModel = db.session.query(KubernetesModel).filter(
            KubernetesModel.project_id == project_id).first()
        application_model: ApplicationModel = db.session.query(ApplicationModel).filter(
            ApplicationModel.application_id == application_id).first_or_404()
        service_models = db.session.query(ServiceModel).filter(
            ServiceModel.application_id == application_id,
            ServiceModel.service_level == service_level).all()
        if not service_models:
            raise RekcurdDashboardException("No services available.")

        service_id_name = dict()
        for service_model in service_models:
            service_id_name[service_model.service_id] = service_model.display_name
        routes = load_istio_routing(kubernetes_model, application_model, service_level)
        response_body = dict()
        response_body["application_name"] = application_model.application_name
        response_body["service_level"] = service_level
        service_weights = list()
        response_body["service_weights"] = service_weights
        for route in routes:
            service_id = route["destination"]["host"][4:]
            display_name = service_id_name.pop(service_id)
            weight = route["weight"]
            service_weights.append({
                "display_name": display_name,
                "service_id": service_id,
                "service_weight": weight})
        for service_id, display_name in service_id_name.items():
            service_weights.append({
                "display_name": display_name,
                "service_id": service_id,
                "service_weight": 0})
        return response_body

    @service_routing_api_namespace.marshal_with(success_or_not)
    @service_routing_api_namespace.expect(service_routing_expect)
    def patch(self, project_id: int, application_id: str):
        """Update routing weights."""
        service_routing_args = self.service_routing_parser.parse_args()
        service_level: str = service_routing_args["service_level"]
        service_ids = []
        service_weights = []
        for service_weight in service_routing_args["service_weights"]:
            service_ids.append(service_weight["service_id"])
            service_weights.append(service_weight["service_weight"])
        apply_new_route_weight(project_id, application_id, service_level, service_ids, service_weights)
        return {"status": True, "message": "Success."}
