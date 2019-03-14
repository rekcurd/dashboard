import uuid

from flask_jwt_simple import get_jwt_identity
from flask_restplus import Namespace, fields, Resource, reqparse

from . import api, status_model, delete_kubernetes_deployment
from rekcurd_dashboard.models import db, ApplicationModel, ApplicationUserRoleModel, ApplicationRole, KubernetesModel, ServiceModel
from rekcurd_dashboard.utils import RekcurdDashboardException
from rekcurd_dashboard.apis import DatetimeToTimestamp


application_api_namespace = Namespace('applications', description='Application API Endpoint.')
success_or_not = application_api_namespace.model('Success', status_model)
application_model_params = application_api_namespace.model('Application', {
    'application_id': fields.String(
        readOnly=True,
        description='Application ID.'
    ),
    'application_name': fields.String(
        required=True,
        description='Application name.',
        example='rekcurd-sample'
    ),
    'project_id': fields.Integer(
        required=False,
        description='Project ID.'
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


@application_api_namespace.route('/projects/<int:project_id>/applications')
class ApiApplications(Resource):
    add_application_parser = reqparse.RequestParser()
    add_application_parser.add_argument('application_name', type=str, required=True, location='form')
    add_application_parser.add_argument('description', type=str, required=False, location='form')

    @application_api_namespace.marshal_list_with(application_model_params)
    def get(self, project_id: int):
        """get_applications"""
        return ApplicationModel.query.filter_by(project_id=project_id).all()

    @application_api_namespace.marshal_with(success_or_not)
    @application_api_namespace.expect(add_application_parser)
    def post(self, project_id: int):
        """add_application"""
        args = self.add_application_parser.parse_args()
        application_name = args['application_name']
        description = args['description']

        application_model = db.session.query(ApplicationModel).filter(
            ApplicationModel.project_id == project_id,
            ApplicationModel.application_name == application_name).one_or_none()
        if application_model is not None:
            raise RekcurdDashboardException("Application name is duplicated.")
        application_id = uuid.uuid4().hex
        application_model = ApplicationModel(
            project_id=project_id, application_id=application_id,
            application_name=application_name, description=description)
        db.session.add(application_model)
        db.session.flush()

        if api.dashboard_config.IS_ACTIVATE_AUTH:
            user_id = get_jwt_identity()
            role = db.session.query(ApplicationUserRoleModel).filter(
                ApplicationUserRoleModel.application_id == application_model.application_id,
                ApplicationUserRoleModel.user_id == user_id).one_or_none()
            if role is None:
                role = ApplicationUserRoleModel(
                    application_id=application_model.application_id,
                    user_id=user_id,
                    application_role=ApplicationRole.admin.name)
                db.session.add(role)
                db.session.flush()

        db.session.commit()
        db.session.close()
        return {"status": True, "message": "Success."}


@application_api_namespace.route('/projects/<int:project_id>/applications/<application_id>')
class ApiApplicationId(Resource):
    edit_application_parser = reqparse.RequestParser()
    edit_application_parser.add_argument('description', type=str, required=True, location='form')

    @application_api_namespace.marshal_with(application_model_params)
    def get(self, project_id: int, application_id: str):
        """get_application"""
        return ApplicationModel.query.filter_by(application_id=application_id).first_or_404()

    @application_api_namespace.marshal_with(success_or_not)
    @application_api_namespace.expect(edit_application_parser)
    def patch(self, project_id: int, application_id: str):
        """update_application"""
        args = self.edit_application_parser.parse_args()
        description = args['description']
        application_model = db.session.query(ApplicationModel).filter(
            ApplicationModel.application_id == application_id).first_or_404()
        application_model.description = description
        db.session.commit()
        db.session.close()
        return {"status": True, "message": "Success."}

    @application_api_namespace.marshal_with(success_or_not)
    def delete(self, project_id: int, application_id: str):
        """delete_application"""
        kubernetes_models = db.session.query(KubernetesModel).filter(
            KubernetesModel.project_id == project_id).all()
        application_model = db.session.query(ApplicationModel).filter(
            ApplicationModel.application_id == application_id).first_or_404()
        service_models = db.session.query(ServiceModel).filter(
            ServiceModel.application_id == application_id).all()
        if len(kubernetes_models):
            """If Kubernetes mode, then request deletion to Kubernetes WebAPI"""
            for service_model in service_models:
                delete_kubernetes_deployment(kubernetes_models, application_id, service_model.service_id)
            db.session.flush()
        else:
            """Otherwise, delete DB entry."""
            # TODO: Kill service process.
            pass
        db.session.delete(application_model)
        db.session.commit()
        db.session.close()
        return {"status": True, "message": "Success."}
