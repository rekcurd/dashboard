import datetime
import json
from itertools import chain

from flask import abort
from flask_restplus import Namespace, fields, Resource, reqparse
from werkzeug.datastructures import FileStorage

from . import api
from drucker_dashboard.models import db, Service, Evaluation, EvaluationResult
from drucker_dashboard.drucker_dashboard_client import DruckerDashboardClient
from drucker_dashboard.utils.hash_util import HashUtil


eval_info_namespace = Namespace('evaluation', description='Evaluation Endpoint.')
success_or_not = eval_info_namespace.model('Success', {
    'status': fields.Boolean(required=True),
    'message': fields.String(required=True)
})
eval_metrics = eval_info_namespace.model('Evaluation result', {
    'num': fields.Integer(required=True, description='number of evaluated data'),
    'accuracy': fields.Float(required=True, description='accuracy of evaluation'),
    'fvalue': fields.List(fields.Float, required=True, description='F-value of evaluation'),
    'precision': fields.List(fields.Float, required=True, description='precision of evaluation'),
    'recall': fields.List(fields.Float, required=True, description='recall of evaluation'),
    'option': fields.Raw(),
    'status': fields.Boolean(required=True),
    'result_id': fields.Integer(required=True, description='ID of evaluation result')
})
eval_data_upload = eval_info_namespace.model('Result of uploading evaluation data', {
    'status': fields.Boolean(required=True),
    'evaluation_id': fields.Integer(required=True, description='ID of uploaded data')
})


@eval_info_namespace.route('/<int:application_id>/evaluations')
class ApiEvaluation(Resource):
    upload_parser = reqparse.RequestParser()
    upload_parser.add_argument('file', location='files', type=FileStorage, required=True)

    @eval_info_namespace.expect(upload_parser)
    @eval_info_namespace.marshal_with(eval_data_upload)
    def post(self, application_id:int):
        """update data to be evaluated"""
        args = self.upload_parser.parse_args()
        file = args['file']
        checksum = HashUtil.checksum(file)

        eobj = db.session.query(Evaluation).filter(
            Evaluation.application_id == application_id,
            Evaluation.checksum == checksum).one_or_none()
        if eobj is not None:
            return {"status": True, "evaluation_id": eobj.evaluation_id}

        eval_data_path = "eval-{0:%Y%m%d%H%M%S}.txt".format(datetime.datetime.utcnow())

        sobj = Service.query.filter_by(application_id=application_id).first_or_404()

        drucker_dashboard_application = DruckerDashboardClient(logger=api.logger, host=sobj.host)
        response_body = drucker_dashboard_application.run_upload_evaluation_data(file, eval_data_path)

        if not response_body['status']:
            raise Exception('Failed to upload')
        eobj = Evaluation(checksum=checksum, application_id=application_id, data_path=eval_data_path)
        db.session.add(eobj)
        db.session.flush()
        evaluation_id = eobj.evaluation_id
        db.session.commit()
        db.session.close()

        return {"status": True, "evaluation_id": evaluation_id}


@eval_info_namespace.route('/<int:application_id>/evaluations/<int:evaluation_id>')
class ApiEvaluation(Resource):

    @eval_info_namespace.marshal_with(success_or_not)
    def delete(self, application_id:int, evaluation_id:int):
        """delete data to be evaluated"""
        eval_query = db.session.query(Evaluation)\
            .filter(Evaluation.application_id == application_id,
                    Evaluation.evaluation_id == evaluation_id)
        if eval_query.one_or_none() is None:
            return {"status": False, "message": "Not Found."}, 404

        eval_query.delete()
        db.session.commit()
        db.session.close()

        return {"status": True, "message": "Success."}


@eval_info_namespace.route('/<int:application_id>/evaluate')
class ApiEvaluate(Resource):
    eval_parser = reqparse.RequestParser()
    eval_parser.add_argument('model_id', location='form', type=int, required=True)
    eval_parser.add_argument('evaluation_id', location='form', type=int, required=False)
    eval_parser.add_argument('overwrite', location='form', type=bool, required=False)

    @eval_info_namespace.expect(eval_parser)
    @eval_info_namespace.marshal_with(eval_metrics)
    def post(self, application_id:int):
        """evaluate"""
        args = self.eval_parser.parse_args()
        eval_id = args.get('evaluation_id', None)
        model_id = args.get('model_id')
        if eval_id:
            eobj = Evaluation.query.filter_by(
                application_id=application_id,
                evaluation_id=eval_id).first_or_404()
        else:
            # if evaluation_id is not given, use the lastest one.
            eobj = Evaluation.query\
                .filter_by(application_id=application_id)\
                .order_by(Evaluation.register_date.desc()).first_or_404()

        # TODO: deploy a temporary service to evaluate, not use an existing service.
        sobj = Service.query.filter(
            Service.application_id == application_id,
            Service.model_id == model_id,
            Service.service_level != 'production').one_or_none()
        if sobj is None:
            raise abort(404, 'The model is not used in any services or used only in production.')

        robj = db.session.query(EvaluationResult)\
            .filter(EvaluationResult.model_id == sobj.model_id,
                    EvaluationResult.evaluation_id == eobj.evaluation_id).one_or_none()
        if robj is not None and args.get('overwrite', False):
            return robj.result

        eval_result_path = "eval-result-{0:%Y%m%d%H%M%S}.txt".format(datetime.datetime.utcnow())
        drucker_dashboard_application = DruckerDashboardClient(logger=api.logger, host=sobj.host)
        response_body = drucker_dashboard_application.run_evaluate_model(eobj.data_path, eval_result_path)

        if response_body['status']:
            result = json.dumps(response_body)
            if robj is None:
                robj = EvaluationResult(model_id=sobj.model_id,
                                        data_path=eval_result_path,
                                        evaluation_id=eobj.evaluation_id,
                                        result=result)
                db.session.add(robj)
            else:
                robj.data_path = eval_result_path
                robj.result = result
            db.session.flush()
            response_body = robj.result
            db.session.commit()
            db.session.close()

        return response_body


@eval_info_namespace.route('/<int:application_id>/evaluation_results/<int:eval_result_id>')
class ApiEvaluationResult(Resource):

    def get(self, application_id:int, eval_result_id:int):
        """get detailed evaluation result"""
        eval_with_result = db.session.query(Evaluation, EvaluationResult)\
            .filter(Evaluation.application_id == application_id,
                    EvaluationResult.evaluation_id == Evaluation.evaluation_id,
                    EvaluationResult.evaluation_result_id == eval_result_id).one_or_none()
        if eval_with_result is None:
            return {"status": False, "message": "Not Found."}, 404
        sobj = Service.query.filter_by(application_id=application_id).first_or_404()
        drucker_dashboard_application = DruckerDashboardClient(logger=api.logger, host=sobj.host)
        eobj = eval_with_result.Evaluation
        robj = eval_with_result.EvaluationResult

        response_body = list(drucker_dashboard_application.run_evaluation_data(eobj.data_path, robj.data_path))
        if len(response_body) == 0:
            return {"status": False, "message": "Result Not Found."}, 404

        return {
            'status': all(r['status'] for r in response_body),
            'metrics': response_body[0]['metrics'],
            'details': list(chain.from_iterable(r['detail'] for r in response_body))
        }

    @eval_info_namespace.marshal_with(success_or_not)
    def delete(self, application_id:int, eval_result_id:int):
        """get detailed evaluation result"""
        eval_with_result = db.session.query(Evaluation, EvaluationResult)\
            .filter(Evaluation.application_id == application_id,
                    EvaluationResult.evaluation_id == Evaluation.evaluation_id,
                    EvaluationResult.evaluation_result_id == eval_result_id).one_or_none()
        if eval_with_result is None:
            return {"status": False, "message": "Not Found."}, 404

        db.session.query(EvaluationResult)\
            .filter(EvaluationResult.evaluation_result_id == eval_result_id).delete()
        db.session.commit()
        db.session.close()

        return {"status": True, "message": "Success."}
