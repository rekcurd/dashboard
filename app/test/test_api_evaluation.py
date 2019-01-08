from unittest.mock import patch, Mock

import drucker_pb2
from .base import BaseTestCase, create_app_obj, create_service_obj, create_eval_obj, create_eval_result_obj
from io import BytesIO
from models import EvaluationResult, Evaluation


class ApiEvaluationTest(BaseTestCase):
    """Tests for ApiEvaluation.
    """

    @patch('core.drucker_dashboard_client.drucker_pb2_grpc.DruckerDashboardStub')
    def test_post(self, mock_stub_class):
        mock_stub_obj = Mock()
        mock_stub_obj.UploadEvaluationData.return_value = drucker_pb2.UploadEvaluationDataResponse(status=1, message='success')
        mock_stub_class.return_value = mock_stub_obj
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
    default_response = {'accuracy': 0.0, 'fvalue': 0.0, 'num': 0,
                        'option': {}, 'precision': 0.0, 'recall': 0.0}

    @patch('core.drucker_dashboard_client.drucker_pb2_grpc.DruckerDashboardStub')
    def test_get(self, mock_stub_class):
        mock_stub_obj = Mock()
        res = drucker_pb2.EvaluationResultResponse(
            metrics=drucker_pb2.EvaluationMetrics(),
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
        mock_stub_class.return_value = mock_stub_obj
        app_id = create_app_obj().application_id
        eobj = create_eval_obj(app_id, save=True)
        sobj = create_service_obj(app_id)
        robj = create_eval_result_obj(model_id=sobj.model_id, evaluation_id=eobj.evaluation_id, save=True)
        response = self.client.get(f'/api/applications/{app_id}/evaluation_result/{robj.evaluation_result_id}')
        self.assertEqual(200, response.status_code)
        self.assertEqual(response.json['status'], True)
        self.assertEqual(response.json['metrics'], self.default_response)
        details = response.json['details']
        self.assertEqual(len(details), 4)
        self.assertEqual(details[0], {'input': 'input', 'label': 'test', 'output': 'test', 'score': 1.0, 'is_correct': True})
        self.assertEqual(details[1], {'input': 0.5, 'label': [0.9, 1.3], 'output': [0.9, 0.3], 'score': [0.5, 0.5], 'is_correct': False})

    @patch('core.drucker_dashboard_client.drucker_pb2_grpc.DruckerDashboardStub')
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
