from unittest.mock import patch, Mock
import json
from copy import deepcopy

from drucker_dashboard.protobuf import drucker_pb2
from .base import BaseTestCase, create_app_obj, create_service_obj, create_eval_obj, create_eval_result_obj
from io import BytesIO
from drucker_dashboard.models import EvaluationResult, Evaluation, db

default_metrics = {'accuracy': 0.0, 'fvalue': [0.0], 'num': 0,
                   'option': {}, 'precision': [0.0], 'recall': [0.0]}


def patch_stub(func):
    def inner_method(*args, **kwargs):
        mock_stub_obj = Mock()
        metrics = drucker_pb2.EvaluationMetrics(precision=[0.0], recall=[0.0], fvalue=[0.0])
        mock_stub_obj.EvaluateModel.return_value = drucker_pb2.EvaluateModelResponse(metrics=metrics)
        mock_stub_obj.UploadEvaluationData.return_value = drucker_pb2.UploadEvaluationDataResponse(status=1, message='success')
        res = drucker_pb2.EvaluationResultResponse(
            metrics=metrics,
            detail=[
                drucker_pb2.EvaluationResultResponse.Detail(
                    input=drucker_pb2.IO(str=drucker_pb2.ArrString(val=['input'])),
                    label=drucker_pb2.IO(str=drucker_pb2.ArrString(val=['test'])),
                    output=drucker_pb2.IO(str=drucker_pb2.ArrString(val=['test'])),
                    is_correct=True,
                    score=[1.0]
                ),
                drucker_pb2.EvaluationResultResponse.Detail(
                    input=drucker_pb2.IO(tensor=drucker_pb2.Tensor(shape=[1], val=[0.5])),
                    label=drucker_pb2.IO(tensor=drucker_pb2.Tensor(shape=[2], val=[0.9, 1.3])),
                    output=drucker_pb2.IO(tensor=drucker_pb2.Tensor(shape=[2], val=[0.9, 0.3])),
                    is_correct=False,
                    score=[0.5, 0.5]
                )
            ])
        mock_stub_obj.EvaluationResult.return_value = iter(res for _ in range(2))
        with patch('drucker_dashboard.drucker_dashboard_client.drucker_pb2_grpc.DruckerDashboardStub',
                   new=Mock(return_value=mock_stub_obj)):
            return func(*args, **kwargs)
    return inner_method


class ApiEvaluationTest(BaseTestCase):
    """Tests for ApiEvaluation.
    """

    @patch_stub
    def test_post(self):
        aobj = create_app_obj()

        url = f'/api/applications/{aobj.application_id}/evaluation'
        content_type = 'multipart/form-data'
        file_content = b'my file contents'
        response = self.client.post(url,
                                    content_type=content_type,
                                    data={'file': (BytesIO(file_content), "file.txt")})
        self.assertEqual(200, response.status_code)
        self.assertEqual(response.json, {'status': True, 'evaluation_id': 1})

        # duplication check
        response = self.client.post(url,
                                    content_type=content_type,
                                    data={'file': (BytesIO(file_content), "file.txt")})
        self.assertEqual(200, response.status_code)
        self.assertEqual(response.json, {'status': True, 'evaluation_id': 1})

    def test_delete(self):
        app_id = create_app_obj().application_id
        eobj = create_eval_obj(app_id, save=True)
        sobj = create_service_obj(app_id)
        create_eval_result_obj(model_id=sobj.model_id, evaluation_id=eobj.evaluation_id, save=True)
        response = self.client.delete(f'/api/applications/{app_id}/evaluation/{eobj.evaluation_id}')
        self.assertEqual(200, response.status_code)
        self.assertEqual(response.json, {'status': True, 'message': 'Success.'})
        self.assertEqual(Evaluation.query.all(), [])
        self.assertEqual(EvaluationResult.query.all(), [])

        response = self.client.delete(f'/api/applications/{app_id}/evaluation/101')
        self.assertEqual(404, response.status_code)
        self.assertEqual(response.json, {'status': False, 'message': 'Not Found.'})


class ApiEvaluationResultTest(BaseTestCase):
    """Tests for ApiEvaluationResult.
    """
    @patch_stub
    def test_get(self):
        app_id = create_app_obj().application_id
        eobj = create_eval_obj(app_id, save=True)
        sobj = create_service_obj(app_id)
        robj = create_eval_result_obj(model_id=sobj.model_id, evaluation_id=eobj.evaluation_id, save=True)
        response = self.client.get(f'/api/applications/{app_id}/evaluation_result/{robj.evaluation_result_id}')
        self.assertEqual(200, response.status_code)
        self.assertEqual(response.json['status'], True)
        self.assertEqual(response.json['metrics'], default_metrics)
        details = response.json['details']
        self.assertEqual(len(details), 4)
        self.assertEqual(details[0], {'input': 'input', 'label': 'test', 'output': 'test', 'score': 1.0, 'is_correct': True})
        self.assertEqual(details[1], {'input': 0.5, 'label': [0.9, 1.3], 'output': [0.9, 0.3], 'score': [0.5, 0.5], 'is_correct': False})

    @patch('drucker_dashboard.drucker_dashboard_client.drucker_pb2_grpc.DruckerDashboardStub')
    def test_get_not_found(self, mock_stub_class):
        app_id = create_app_obj().application_id
        eobj = create_eval_obj(app_id, save=True)
        sobj = create_service_obj(app_id)
        robj = create_eval_result_obj(model_id=sobj.model_id, evaluation_id=eobj.evaluation_id, save=True)
        response = self.client.get(f'/api/applications/{app_id}/evaluation_result/{robj.evaluation_result_id}')
        self.assertEqual(404, response.status_code)
        self.assertEqual(response.json, {'status': False, 'message': 'Result Not Found.'})

        response = self.client.get(f'/api/applications/{app_id}/evaluation_result/101')
        self.assertEqual(404, response.status_code)
        self.assertEqual(response.json, {'status': False, 'message': 'Not Found.'})

    def test_delete(self):
        app_id = create_app_obj().application_id
        eobj = create_eval_obj(app_id, save=True)
        sobj = create_service_obj(app_id)
        robj = create_eval_result_obj(model_id=sobj.model_id, evaluation_id=eobj.evaluation_id, save=True)
        response = self.client.delete(f'/api/applications/{app_id}/evaluation_result/{robj.evaluation_result_id}')
        self.assertEqual(200, response.status_code)
        self.assertEqual(response.json, {'status': True, 'message': 'Success.'})
        self.assertEqual(EvaluationResult.query.all(), [])

        response = self.client.delete(f'/api/applications/{app_id}/evaluation_result/101')
        self.assertEqual(404, response.status_code)
        self.assertEqual(response.json, {'status': False, 'message': 'Not Found.'})


class ApiEvaluateTest(BaseTestCase):
    """Tests for ApiEvaluate.
    """
    default_response = dict(default_metrics, result_id=1, status=True)

    @patch_stub
    def test_post(self):
        aobj = create_app_obj()
        sobj = create_service_obj(aobj.application_id)
        model_id = sobj.model_id
        evaluation_id = create_eval_obj(aobj.application_id, save=True).evaluation_id

        response = self.client.post(f'/api/applications/{aobj.application_id}/evaluate',
                                    data={'evaluation_id': evaluation_id, 'service_id': sobj.service_id})
        self.assertEqual(200, response.status_code)
        self.assertEqual(response.json, self.default_response)
        eobj_exists = db.session.query(EvaluationResult)\
            .filter(EvaluationResult.model_id == model_id,
                    EvaluationResult.evaluation_id == evaluation_id).one_or_none() is not None
        self.assertEqual(eobj_exists, True)

    @patch_stub
    def test_post_without_param(self):
        aobj = create_app_obj()
        sobj = create_service_obj(aobj.application_id)
        model_id = sobj.model_id
        create_eval_obj(aobj.application_id, checksum='12345', save=True)
        create_eval_obj(aobj.application_id, checksum='6789', save=True)
        create_eval_obj(aobj.application_id, checksum='abc', save=True)
        newest_eval_id = create_eval_obj(aobj.application_id, save=True).evaluation_id

        response = self.client.post(f'/api/applications/{aobj.application_id}/evaluate',
                                    data={'service_id': sobj.service_id})
        self.assertEqual(200, response.status_code)
        self.assertEqual(response.json, self.default_response)
        eobj_exists = db.session.query(EvaluationResult)\
            .filter(EvaluationResult.model_id == model_id,
                    EvaluationResult.evaluation_id == newest_eval_id).one_or_none() is not None
        self.assertEqual(eobj_exists, True)

    @patch_stub
    def test_post_duplicated(self):
        saved_response = deepcopy(self.default_response)
        aobj = create_app_obj()
        sobj = create_service_obj(aobj.application_id)
        model_id = sobj.model_id
        evaluation_id = create_eval_obj(aobj.application_id, save=True).evaluation_id
        create_eval_result_obj(model_id=model_id,
                               evaluation_id=evaluation_id,
                               result=json.dumps(saved_response),
                               save=True)

        url = f'/api/applications/{aobj.application_id}/evaluate'
        data = {'evaluation_id': evaluation_id, 'service_id': sobj.service_id}
        response = self.client.post(url, data=data)
        self.assertEqual(200, response.status_code)
        self.assertEqual(response.json, saved_response)

        # overwrite
        response = self.client.post(url, data=dict(data, overwrite=True))
        self.assertEqual(200, response.status_code)
        self.assertEqual(response.json, self.default_response)

        eobj = db.session.query(EvaluationResult)\
            .filter(EvaluationResult.model_id == model_id,
                    EvaluationResult.evaluation_id == evaluation_id).one()
        self.assertEqual(eobj.result, self.default_response)
