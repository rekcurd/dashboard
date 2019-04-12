import datetime
import tempfile

from flask_restplus import Namespace, fields, Resource, reqparse

from werkzeug.datastructures import FileStorage

from . import DatetimeToTimestamp, status_model
from rekcurd_dashboard.core import RekcurdDashboardClient
from rekcurd_dashboard.data_servers import DataServer
from rekcurd_dashboard.models import db, DataServerModel, DataServerModeEnum, ApplicationModel, ServiceModel, ModelModel
from rekcurd_dashboard.utils import RekcurdDashboardException


model_api_namespace = Namespace('models', description='Model API Endpoint.')
success_or_not = model_api_namespace.model('Status', status_model)
model_model_params = model_api_namespace.model('Model', {
    'model_id': fields.Integer(
        readOnly=True,
        description='Model ID.'
    ),
    'application_id': fields.String(
        readOnly=True,
        description='Application ID.'
    ),
    'filepath': fields.String(
        readOnly=True,
        description='Model file path.',
        example='ml-1234567.model'
    ),
    'register_date': DatetimeToTimestamp(
        readOnly=True,
        description='Register date.'
    ),
    'description': fields.String(
        required=True,
        description='Description.',
        example='This is a sample.'
    )
})


@model_api_namespace.route('/projects/<int:project_id>/applications/<application_id>/models')
class ApiModels(Resource):
    upload_model_parser = reqparse.RequestParser()
    upload_model_parser.add_argument('filepath', location='files',
                                     type=FileStorage, required=True)
    upload_model_parser.add_argument('description', type=str, required=True, location='form')

    @model_api_namespace.marshal_list_with(model_model_params)
    def get(self, project_id: int, application_id: str):
        """get_models"""
        return ModelModel.query.filter_by(application_id=application_id).all()

    @model_api_namespace.marshal_with(success_or_not)
    @model_api_namespace.expect(upload_model_parser)
    def post(self, project_id: int, application_id: str):
        """upload_model"""
        args = self.upload_model_parser.parse_args()
        file: FileStorage = args['filepath']
        description: str = args['description']

        data_server_model: DataServerModel = db.session.query(
            DataServerModel).filter(DataServerModel.project_id == project_id).first_or_404()
        application_model: ApplicationModel = db.session.query(
            ApplicationModel).filter(ApplicationModel.application_id == application_id).first()
        if data_server_model.data_server_mode == DataServerModeEnum.LOCAL:
            """Only if DataServerModeEnum.LOCAL, send file to the server."""
            filepath = "ml-{0:%Y%m%d%H%M%S}.model".format(datetime.datetime.utcnow())
            service_models = db.session.query(
                ServiceModel).filter(ServiceModel.application_id == application_id).all()
            for service_model in service_models:
                rekcurd_dashboard_application = RekcurdDashboardClient(
                    host=service_model.insecure_host, port=service_model.insecure_port,
                    application_name=application_model.application_name,
                    service_level=service_model.service_level, rekcurd_grpc_version=service_model.version)
                response_body = rekcurd_dashboard_application.run_upload_model(filepath, file)
                if not response_body.get("status", True):
                    raise RekcurdDashboardException(response_body.get("message", "Error."))
            response_body = {"status": True, "message": "Success."}
        else:
            """Otherwise, upload file."""
            with tempfile.NamedTemporaryFile() as fp:
                fp.write(file.read())
                data_server = DataServer()
                filepath = data_server.upload_model(data_server_model, application_model, fp.name)
                response_body = {"status": True, "message": "Success."}

        model_model = ModelModel(application_id=application_id, filepath=filepath, description=description)
        db.session.add(model_model)
        db.session.commit()
        db.session.close()
        return response_body


@model_api_namespace.route('/projects/<int:project_id>/applications/<application_id>/models/<int:model_id>')
class ApiModelId(Resource):
    update_config_parser = reqparse.RequestParser()
    update_config_parser.add_argument('description', type=str, required=True, location='form')

    @model_api_namespace.marshal_with(model_model_params)
    def get(self, project_id: int, application_id: str, model_id: int):
        """get_model"""
        return ModelModel.query.filter_by(model_id=model_id).first_or_404()

    @model_api_namespace.marshal_with(success_or_not)
    @model_api_namespace.expect(update_config_parser)
    def patch(self, project_id: int, application_id: str, model_id: int):
        """update_model"""
        args = self.update_config_parser.parse_args()
        description = args['description']

        model_model = db.session.query(ModelModel).filter(ModelModel.model_id==model_id).first_or_404()
        model_model.description = description
        db.session.commit()
        db.session.close()
        return {"status": True, "message": "Success."}

    @model_api_namespace.marshal_with(success_or_not)
    def delete(self, project_id: int, application_id: str, model_id: int):
        """delete_model"""
        model_model = db.session.query(ModelModel).filter(ModelModel.model_id==model_id).one_or_none()
        if model_model is None:
            raise RekcurdDashboardException("No such model_id.")
        num = db.session.query(ServiceModel).filter(ServiceModel.model_id==model_id).count()
        if num > 0:
            raise RekcurdDashboardException("Model is used by some services.")
        # TODO: Delete file.
        db.session.query(ModelModel).filter(ModelModel.model_id==model_id).delete()
        db.session.commit()
        db.session.close()
        return {"status": True, "message": "Success."}
