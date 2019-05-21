import datetime
import tempfile
from itertools import chain
import os

from flask import abort, send_file
from flask_restplus import Namespace, fields, Resource, reqparse, inputs
from flask_jwt_simple import get_jwt_identity
from werkzeug.datastructures import FileStorage

from . import DatetimeToTimestamp, status_model
from rekcurd_dashboard.data_servers import DataServer
from rekcurd_dashboard.models import (db, ApplicationModel, ServiceModel, EvaluationModel,
                                      EvaluationResultModel, DataServerModel, DataServerModeEnum,
                                      ApplicationRole, ModelModel)
from rekcurd_dashboard.core import RekcurdDashboardClient
from rekcurd_dashboard.utils import HashUtil, RekcurdDashboardException, ApplicationUserRoleException
from rekcurd_dashboard.auth import auth, fetch_application_role


evaluation_api_namespace = Namespace('evaluation', description='Evaluation API Endpoint.')
success_or_not = evaluation_api_namespace.model('Success', status_model)
eval_metrics = evaluation_api_namespace.model('Evaluation result', {
    'num': fields.Integer(required=True, description='number of evaluated data'),
    'accuracy': fields.Float(required=True, description='accuracy of evaluation'),
    'fvalue': fields.List(fields.Float, required=True, description='F-value of evaluation'),
    'precision': fields.List(fields.Float, required=True, description='precision of evaluation'),
    'recall': fields.List(fields.Float, required=True, description='recall of evaluation'),
    'option': fields.Raw(),
    'label': fields.Raw(),
    'status': fields.Boolean(required=True),
    'result_id': fields.Integer(required=True, description='ID of evaluation result')
})
eval_data_upload = evaluation_api_namespace.model('Result of uploading evaluation data', {
    'status': fields.Boolean(required=True),
    'message': fields.String(required=False),
    'evaluation_id': fields.Integer(required=True, description='ID of uploaded data')
})
evaluation_params = evaluation_api_namespace.model('Evaluation', {
    'evaluation_id': fields.Integer(
        readOnly=True,
        description='Evaluation ID.'
    ),
    'checksum': fields.String(
        readOnly=True,
        description='Checksum for file content'
    ),
    'application_id': fields.String(
        readOnly=True,
        description='Application ID.'
    ),
    'description': fields.String(
        readOnly=True,
        description='Description of evaluation data'
    ),
    'data_path': fields.String(
        readOnly=True,
        description='Evaluation file path'
    ),
    'register_date': DatetimeToTimestamp(
        readOnly=True,
        description='Register date'
    )
})


@evaluation_api_namespace.route('/projects/<int:project_id>/applications/<application_id>/evaluations')
class ApiEvaluations(Resource):
    upload_parser = reqparse.RequestParser()
    upload_parser.add_argument('filepath', location='files', type=FileStorage, required=True)
    upload_parser.add_argument('description', location='form', type=str, required=True)
    upload_parser.add_argument('duplicated_ok', location='form', type=bool, required=False, default=False)

    @evaluation_api_namespace.expect(upload_parser)
    @evaluation_api_namespace.marshal_with(eval_data_upload)
    def post(self, project_id: int, application_id: str):
        """update data to be evaluated"""
        args = self.upload_parser.parse_args()
        file = args['filepath']
        description = args['description']
        checksum = HashUtil.checksum(file)

        evaluation_model = db.session.query(EvaluationModel).filter(
            EvaluationModel.application_id == application_id,
            EvaluationModel.checksum == checksum).one_or_none()
        if evaluation_model is not None:
            return {"status": True,
                    "message": 'The file already exists. Description: {}'.format(
                        evaluation_model.description),
                    "evaluation_id": evaluation_model.evaluation_id}

        application_model: ApplicationModel = db.session.query(ApplicationModel).filter(
            ApplicationModel.application_id == application_id).first_or_404()
        data_server_model: DataServerModel = db.session.query(
            DataServerModel).filter(DataServerModel.project_id == project_id).first_or_404()

        if data_server_model.data_server_mode == DataServerModeEnum.LOCAL:
            """Only if DataServerModeEnum.LOCAL, send file to the server."""
            service_model: ServiceModel = db.session.query(ServiceModel).filter(
                ServiceModel.application_id == application_id).first_or_404()
            rekcurd_dashboard_client = RekcurdDashboardClient(
                host=service_model.insecure_host, port=service_model.insecure_port,
                application_name=application_model.application_name,
                service_level=service_model.service_level, rekcurd_grpc_version=service_model.version)
            eval_data_path = "eval-{0:%Y%m%d%H%M%S}.txt".format(datetime.datetime.utcnow())
            response_body = rekcurd_dashboard_client.run_upload_evaluation_data(file, eval_data_path)
            if not response_body['status']:
                raise RekcurdDashboardException('Failed to upload')
        else:
            """Otherwise, upload file."""
            with tempfile.NamedTemporaryFile() as fp:
                fp.write(file.read())
                fp.flush()
                data_server = DataServer()
                eval_data_path = data_server.upload_evaluation_data(data_server_model, application_model, fp.name)

        evaluation_model = EvaluationModel(
            checksum=checksum, application_id=application_id, data_path=eval_data_path, description=description)
        db.session.add(evaluation_model)
        db.session.flush()
        evaluation_id = evaluation_model.evaluation_id
        db.session.commit()
        db.session.close()
        return {"status": True, "evaluation_id": evaluation_id}

    @evaluation_api_namespace.marshal_list_with(evaluation_params)
    def get(self, project_id: int, application_id: str):
        """get_evaluations"""
        return EvaluationModel.query.filter_by(application_id=application_id).all()


@evaluation_api_namespace.route('/projects/<int:project_id>/applications/<application_id>/evaluations/<int:evaluation_id>')
class ApiEvaluationId(Resource):
    @evaluation_api_namespace.marshal_with(success_or_not)
    def delete(self, project_id: int, application_id: str, evaluation_id: int):
        """delete data to be evaluated"""
        eval_query = db.session.query(EvaluationModel).filter(
            EvaluationModel.application_id == application_id,
            EvaluationModel.evaluation_id == evaluation_id)
        evaluation_model = eval_query.one_or_none()
        if evaluation_model is None:
            return {"status": False, "message": "Not Found."}, 404

        data_server_model: DataServerModel = db.session.query(
            DataServerModel).filter(DataServerModel.project_id == project_id).first_or_404()
        data_server = DataServer()
        data_server.delete_file(data_server_model, evaluation_model.data_path)

        eval_query.delete()
        db.session.commit()
        db.session.close()
        return {"status": True, "message": "Success."}


@evaluation_api_namespace.route('/projects/<int:project_id>/applications/<application_id>/evaluations/<int:evaluation_id>/download')
class ApiEvaluationIdDownload(Resource):
    @evaluation_api_namespace.response(200, description='return evaluation text file.')
    @evaluation_api_namespace.produces(['text/plain'])
    def get(self, project_id: int, application_id: str, evaluation_id: int):
        """download evaluation data as file"""
        if auth.is_enabled():
            user_id = get_jwt_identity()
            application_user_role = fetch_application_role(user_id, application_id)
            if application_user_role == ApplicationRole.viewer:
                raise ApplicationUserRoleException("Viewer role is not allowed to see evaluation data")
        evaluation_model = db.session.query(EvaluationModel).filter(
            EvaluationModel.application_id == application_id,
            EvaluationModel.evaluation_id == evaluation_id).first_or_404()

        data_server_model: DataServerModel = db.session.query(
            DataServerModel).filter(DataServerModel.project_id == project_id).first_or_404()
        data_server = DataServer()
        local_filepath = 'tmp.eval'
        data_server.download_file(data_server_model,
                                  evaluation_model.data_path,
                                  local_filepath)

        response = send_file(local_filepath, as_attachment=True,
                             attachment_filename='evaluation_{}.txt'.format(evaluation_id),
                             mimetype='text/plain')
        os.remove(local_filepath)
        return response


@evaluation_api_namespace.route('/projects/<int:project_id>/applications/<application_id>/evaluate')
class ApiEvaluate(Resource):
    eval_parser = reqparse.RequestParser()
    eval_parser.add_argument('model_id', location='form', type=int, required=True)
    eval_parser.add_argument('evaluation_id', location='form', type=int, required=False)
    eval_parser.add_argument('overwrite', location='form', type=inputs.boolean, required=False, default=False)

    @evaluation_api_namespace.expect(eval_parser)
    @evaluation_api_namespace.marshal_with(eval_metrics)
    def post(self, project_id: int, application_id: str):
        """evaluate"""
        args = self.eval_parser.parse_args()
        eval_id = args.get('evaluation_id', None)
        model_id = args.get('model_id')
        do_overwrite = args.get('overwrite')
        if eval_id:
            evaluation_model = EvaluationModel.query.filter_by(
                application_id=application_id,
                evaluation_id=eval_id).first_or_404()
        else:
            # if evaluation_id is not given, use the lastest one.
            evaluation_model = EvaluationModel.query.filter_by(
                application_id=application_id).order_by(EvaluationModel.register_date.desc()).first_or_404()

        # TODO: deploy a temporary service to evaluate, not use an existing service.
        service_model = ServiceModel.query.filter(
            ServiceModel.application_id == application_id,
            ServiceModel.model_id == model_id,
            ServiceModel.service_level != 'production').first()
        if service_model is None:
            raise abort(404, 'The model is not used in any services or used only in production.')

        evaluation_result_model = db.session.query(EvaluationResultModel).filter(
            EvaluationResultModel.model_id == service_model.model_id,
            EvaluationResultModel.evaluation_id == evaluation_model.evaluation_id).one_or_none()
        if evaluation_result_model is not None and not do_overwrite:
            raise RekcurdDashboardException(
                "Evaluation with the model and data is already done before. Set overwrite = true for re-evaluation")

        eval_result_path = "eval-result-{0:%Y%m%d%H%M%S}.pkl".format(datetime.datetime.utcnow())
        application_model: ApplicationModel = db.session.query(ApplicationModel).filter(
            ApplicationModel.application_id == application_id).first_or_404()
        rekcurd_dashboard_client = RekcurdDashboardClient(
            host=service_model.insecure_host, port=service_model.insecure_port, application_name=application_model.application_name,
            service_level=service_model.service_level, rekcurd_grpc_version=service_model.version)
        response_body = rekcurd_dashboard_client.run_evaluate_model(evaluation_model.data_path, eval_result_path)

        if response_body['status']:
            if evaluation_result_model is None:
                evaluation_result_model = EvaluationResultModel(
                    model_id=service_model.model_id,
                    data_path=eval_result_path,
                    evaluation_id=evaluation_model.evaluation_id,
                    result=response_body)
                db.session.add(evaluation_result_model)
            else:
                evaluation_result_model.data_path = eval_result_path
                evaluation_result_model.result = response_body
                evaluation_result_model.register_date = datetime.datetime.utcnow()
            db.session.flush()
            response_body = evaluation_result_model.result
            db.session.commit()

        db.session.close()
        return response_body


@evaluation_api_namespace.route('/projects/<int:project_id>/applications/<application_id>/evaluation_results')
class ApiEvaluationResults(Resource):
    def get(self, project_id: int, application_id: str):
        """get all evaluation results and belonging models and evaluation data"""
        rows = db.session.query(EvaluationModel, EvaluationResultModel, ModelModel)\
            .filter(EvaluationModel.application_id == application_id,
                    EvaluationResultModel.evaluation_id == EvaluationModel.evaluation_id,
                    EvaluationResultModel.model_id == ModelModel.model_id).all()
        results = []
        for row in rows:
            result = row.EvaluationResultModel.serialize
            result['model'] = row.ModelModel.serialize
            result['evaluation'] = row.EvaluationModel.serialize
            results.append(result)
        return results


@evaluation_api_namespace.route('/projects/<int:project_id>/applications/<application_id>/evaluation_results/<int:eval_result_id>')
class ApiEvaluationResultId(Resource):
    def get(self, project_id: int, application_id: str, eval_result_id: int):
        """get detailed evaluation result"""
        eval_with_result = db.session.query(EvaluationModel, EvaluationResultModel)\
            .filter(EvaluationModel.application_id == application_id,
                    EvaluationResultModel.evaluation_id == EvaluationModel.evaluation_id,
                    EvaluationResultModel.evaluation_result_id == eval_result_id).one_or_none()
        if eval_with_result is None:
            return {"status": False, "message": "Not Found."}, 404

        application_model: ApplicationModel = db.session.query(ApplicationModel).filter(
            ApplicationModel.application_id == application_id).first_or_404()
        service_model: ServiceModel = db.session.query(ServiceModel).filter(
            ServiceModel.application_id == application_id).first_or_404()
        rekcurd_dashboard_client = RekcurdDashboardClient(
            host=service_model.insecure_host, port=service_model.insecure_port, application_name=application_model.application_name,
            service_level=service_model.service_level, rekcurd_grpc_version=service_model.version)
        evaluation_model = eval_with_result.EvaluationModel
        evaluation_result_model = eval_with_result.EvaluationResultModel

        response_body = list(rekcurd_dashboard_client.run_evaluation_data(
            evaluation_model.data_path, evaluation_result_model.data_path))
        if len(response_body) == 0:
            return {"status": False, "message": "Result Not Found."}, 404

        return {
            'status': all(r['status'] for r in response_body),
            'metrics': evaluation_result_model.result,
            'details': list(chain.from_iterable(r['detail'] for r in response_body))
        }

    @evaluation_api_namespace.marshal_with(success_or_not)
    def delete(self, project_id: int, application_id: str, eval_result_id: int):
        """get detailed evaluation result"""
        eval_with_result = db.session.query(EvaluationModel, EvaluationResultModel)\
            .filter(EvaluationModel.application_id == application_id,
                    EvaluationResultModel.evaluation_id == EvaluationModel.evaluation_id,
                    EvaluationResultModel.evaluation_result_id == eval_result_id).one_or_none()
        if eval_with_result is None:
            return {"status": False, "message": "Not Found."}, 404
        data_server_model: DataServerModel = db.session.query(
            DataServerModel).filter(DataServerModel.project_id == project_id).first_or_404()
        data_server = DataServer()
        evaluation_result_model = eval_with_result.EvaluationResultModel
        data_server.delete_file(data_server_model, evaluation_result_model.data_path)

        db.session.query(EvaluationResultModel).filter(
            EvaluationResultModel.evaluation_result_id == eval_result_id).delete()
        db.session.commit()
        db.session.close()
        return {"status": True, "message": "Success."}
