import datetime

from flask_restplus import Namespace, fields, Resource, reqparse

from werkzeug.datastructures import FileStorage

from . import api, DatetimeToTimestamp
from drucker_dashboard import DruckerDashboardClient
from drucker_dashboard.models import db, Service, Model


mdl_info_namespace = Namespace('models', description='Model Endpoint.')
success_or_not = mdl_info_namespace.model('Success', {
    'status': fields.Boolean(
        required=True
    ),
    'message': fields.String(
        required=True
    )
})
mdl_info = mdl_info_namespace.model('Model', {
    'model_id': fields.Integer(
        readOnly=True,
        description='Model ID.'
    ),
    'application_id': fields.Integer(
        readOnly=True,
        description='Application ID.'
    ),
    'model_path': fields.String(
        readOnly=True,
        description='Model file path.',
        example='/ml-1234567.model'
    ),
    'register_date': DatetimeToTimestamp(
        readOnly=True,
        description='Register date.'
    ),
    'description': fields.String(
        required=False,
        description='Description.',
        example='This is a sample.'
    )
})

@mdl_info_namespace.route('/<int:application_id>/models')
class ApiApplicationIdModels(Resource):
    upload_model_parser = reqparse.RequestParser()
    upload_model_parser.add_argument('file', location='files',
                                     type=FileStorage, required=True)
    upload_model_parser.add_argument('description', type=str, required=False, location='form')

    @mdl_info_namespace.marshal_list_with(mdl_info)
    def get(self, application_id:int):
        """get_models"""
        return Model.query.filter_by(application_id=application_id).all()

    @mdl_info_namespace.marshal_with(success_or_not)
    @mdl_info_namespace.expect(upload_model_parser)
    def post(self, application_id:int):
        """upload_model"""
        args = self.upload_model_parser.parse_args()
        file = args['file']
        description = args['description']
        model_path = "ml-{0:%Y%m%d%H%M%S}.model".format(datetime.datetime.utcnow())

        sobj = db.session.query(Service).filter(Service.application_id == application_id).first()
        host = sobj.host
        drucker_dashboard_application = DruckerDashboardClient(logger=api.logger, host=host)
        response_body = drucker_dashboard_application.run_upload_model(model_path, file)
        if not response_body.get("status", True):
            raise Exception(response_body.get("message", "Error."))

        mobj = Model(application_id=application_id,
                     model_path=model_path,
                     description=description)
        db.session.add(mobj)
        db.session.commit()
        db.session.close()
        return response_body

@mdl_info_namespace.route('/<int:application_id>/models/<int:model_id>')
class ApiApplicationIdModelId(Resource):
    update_config_parser = reqparse.RequestParser()
    update_config_parser.add_argument('description', type=str, required=True, location='form')

    @mdl_info_namespace.marshal_with(mdl_info)
    def get(self, application_id:int, model_id:int):
        """get_model"""
        return Model.query.filter_by(
            application_id=application_id,
            model_id=model_id).first_or_404()

    @mdl_info_namespace.marshal_with(success_or_not)
    @mdl_info_namespace.expect(update_config_parser)
    def patch(self, application_id:int, model_id:int):
        """update_model"""
        args = self.update_config_parser.parse_args()
        description = args['description']

        mobj = db.session.query(Model).filter(
            Model.application_id==application_id,
            Model.model_id==model_id).one()
        mobj.description = description
        response_body = {"status": True, "message": "Success."}
        db.session.commit()
        db.session.close()
        return response_body

    @mdl_info_namespace.marshal_with(success_or_not)
    def delete(self, application_id:int, model_id:int):
        """delete_model"""
        mobj = db.session.query(Model).filter(
            Model.application_id==application_id,
            Model.model_id==model_id).one_or_none()
        if mobj is None:
            raise Exception("No such model_id.")
        db.session.query(Model).filter(
            Model.application_id==application_id,
            Model.model_id==model_id).delete()
        response_body = {"status": True, "message": "Success."}
        db.session.commit()
        db.session.close()
        return response_body
