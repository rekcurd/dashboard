import datetime

from flask_restplus import Namespace, fields, Resource, reqparse

from . import (
    DatetimeToTimestamp, status_model,
    switch_model_assignment, delete_kubernetes_deployment
)
from rekcurd_dashboard.models import db, KubernetesModel, ServiceModel


service_api_namespace = Namespace('services', description='Service API Endpoint.')
success_or_not = service_api_namespace.model('Success', status_model)
service_model_params = service_api_namespace.model('Service', {
    'service_id': fields.String(
        readOnly=True,
        description='Service ID.'
    ),
    'application_id': fields.String(
        readOnly=True,
        description='Application ID.'
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
        required=True,
        description='Rekcurd gRPC spec version.',
        example='v1'
    ),
    'model_id': fields.Integer(
        readOnly=True,
        description='Model ID.'
    ),
    'host': fields.String(
        required=True,
        description='host.',
        example='rekcurd-sample.example.com'
    ),
    'port': fields.Integer(
        required=True,
        description='port.',
        example='5000'
    ),
    'register_date': DatetimeToTimestamp(
        readOnly=True,
        description='Register date.'
    ),
    'update_date': DatetimeToTimestamp(
        readOnly=True,
        description='Update date.'
    )
})


@service_api_namespace.route('/projects/<int:project_id>/applications/<application_id>/services')
class ApiServices(Resource):
    @service_api_namespace.marshal_list_with(service_model_params)
    def get(self, project_id: int, application_id: str):
        """get_services"""
        return ServiceModel.query.filter_by(application_id=application_id).all()


@service_api_namespace.route('/projects/<int:project_id>/applications/<application_id>/services/<service_id>')
class ApiServiceId(Resource):
    switch_model_parser = reqparse.RequestParser()
    switch_model_parser.add_argument('model_id', type=int, required=True, location='form')

    update_config_parser = reqparse.RequestParser()
    update_config_parser.add_argument('display_name', type=str, required=False, location='form')
    update_config_parser.add_argument('description', type=str, required=False, location='form')
    update_config_parser.add_argument('version', type=str, required=False, location='form')

    @service_api_namespace.marshal_with(service_model_params)
    def get(self, project_id: int, application_id: str, service_id: str):
        """get_service"""
        return ServiceModel.query.filter_by(application_id=application_id, service_id=service_id).first_or_404()

    @service_api_namespace.marshal_with(success_or_not)
    @service_api_namespace.expect(switch_model_parser)
    def put(self, project_id: int, application_id: str, service_id: str):
        """switch_service_model_assignment"""
        args = self.switch_model_parser.parse_args()
        model_id = args['model_id']
        response_body = switch_model_assignment(project_id, application_id, service_id, model_id)
        db.session.commit()
        db.session.close()
        return response_body

    @service_api_namespace.marshal_with(success_or_not)
    @service_api_namespace.expect(update_config_parser)
    def patch(self, project_id: int, application_id: str, service_id: str):
        """update_service_config"""
        args = self.update_config_parser.parse_args()
        display_name = args['display_name']
        description = args['description']
        version = args['version']

        service_model: ServiceModel = db.session.query(ServiceModel).filter(ServiceModel.service_id == service_id).one()
        is_updated = False
        if display_name is not None:
            is_updated = True
            service_model.display_name = display_name
        if description is not None:
            is_updated = True
            service_model.description = description
        if version is not None:
            is_updated = True
            service_model.version = version
        if is_updated:
            service_model.update_date = datetime.datetime.utcnow()
            db.session.commit()
        response_body = {"status": True, "message": "Success."}
        db.session.close()
        return response_body

    @service_api_namespace.marshal_with(success_or_not)
    def delete(self, project_id: int, application_id: str, service_id: str):
        """delete_service"""
        kubernetes_models = db.session.query(KubernetesModel).filter(
            KubernetesModel.project_id == project_id).all()
        if len(kubernetes_models):
            """If Kubernetes mode, then request deletion to Kubernetes WebAPI"""
            delete_kubernetes_deployment(kubernetes_models, application_id, service_id)
        else:
            """Otherwise, delete DB entry."""
            # TODO: Kill service process.
            db.session.query(ServiceModel).filter(ServiceModel.service_id == service_id).delete()
            db.session.flush()
        response_body = {"status": True, "message": "Success."}
        db.session.commit()
        db.session.close()
        return response_body
