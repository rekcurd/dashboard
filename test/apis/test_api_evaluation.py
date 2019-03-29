from unittest.mock import patch, Mock
import json
from copy import deepcopy

from rekcurd_dashboard.protobuf import rekcurd_pb2
from test.base import (
    BaseTestCase, create_service_model, create_eval_model, create_eval_result_model,
    TEST_PROJECT_ID, TEST_APPLICATION_ID, TEST_MODEL_ID
)
from io import BytesIO
from rekcurd_dashboard.models import EvaluationResultModel, EvaluationModel, db

default_metrics = {
    'accuracy': 0.0, 'fvalue': [0.0], 'num': 0, 'option': {}, 'precision': [0.0], 'recall': [0.0], 'label': ['label']
}


def patch_stub(func):
    def inner_method(*args, **kwargs):
        mock_stub_obj = Mock()
        metrics = rekcurd_pb2.EvaluationMetrics(
            precision=[0.0], recall=[0.0], fvalue=[0.0],
            label=[rekcurd_pb2.IO(str=rekcurd_pb2.ArrString(val=['label']))])
        mock_stub_obj.EvaluateModel.return_value = rekcurd_pb2.EvaluateModelResponse(metrics=metrics)
        mock_stub_obj.UploadEvaluationData.return_value = \
            rekcurd_pb2.UploadEvaluationDataResponse(status=1, message='success')
        res = rekcurd_pb2.EvaluationResultResponse(
            metrics=metrics,
            detail=[
                rekcurd_pb2.EvaluationResultResponse.Detail(
                    input=rekcurd_pb2.IO(str=rekcurd_pb2.ArrString(val=['input'])),
                    label=rekcurd_pb2.IO(str=rekcurd_pb2.ArrString(val=['test'])),
                    output=rekcurd_pb2.IO(str=rekcurd_pb2.ArrString(val=['test'])),
                    is_correct=True,
                    score=[1.0]
                ),
                rekcurd_pb2.EvaluationResultResponse.Detail(
                    input=rekcurd_pb2.IO(tensor=rekcurd_pb2.Tensor(shape=[1], val=[0.5])),
                    label=rekcurd_pb2.IO(tensor=rekcurd_pb2.Tensor(shape=[2], val=[0.9, 1.3])),
                    output=rekcurd_pb2.IO(tensor=rekcurd_pb2.Tensor(shape=[2], val=[0.9, 0.3])),
                    is_correct=False,
                    score=[0.5, 0.5]
                )
            ])
        mock_stub_obj.EvaluationResult.return_value = iter(res for _ in range(2))
        with patch('rekcurd_dashboard.core.rekcurd_dashboard_client.rekcurd_pb2_grpc.RekcurdDashboardStub',
                   new=Mock(return_value=mock_stub_obj)):
            return func(*args, **kwargs)
    return inner_method


class ApiEvaluationTest(BaseTestCase):
    """Tests for ApiEvaluation.
    """

    @patch_stub
    def test_post(self):
        url = f'/api/projects/{TEST_PROJECT_ID}/applications/{TEST_APPLICATION_ID}/evaluations'
        content_type = 'multipart/form-data'
        file_content = b'my file contents'
        response = self.client.post(
            url, content_type=content_type, data={'file': (BytesIO(file_content), "file.txt")})
        self.assertEqual(200, response.status_code)
        self.assertEqual(response.json, {'status': True, 'evaluation_id': 1})

        # duplication check
        response = self.client.post(
            url, content_type=content_type, data={'file': (BytesIO(file_content), "file.txt")})
        self.assertEqual(200, response.status_code)
        self.assertEqual(response.json, {'status': True, 'evaluation_id': 1})

    def test_delete(self):
        evaluation_model = create_eval_model(TEST_APPLICATION_ID, save=True)
        create_eval_result_model(model_id=TEST_MODEL_ID, evaluation_id=evaluation_model.evaluation_id, save=True)
        response = self.client.delete(
            f'/api/projects/{TEST_PROJECT_ID}/applications/{TEST_APPLICATION_ID}/'
            f'evaluations/{evaluation_model.evaluation_id}')
        self.assertEqual(200, response.status_code)
        self.assertEqual(response.json, {'status': True, 'message': 'Success.'})
        self.assertEqual(EvaluationModel.query.all(), [])
        self.assertEqual(EvaluationResultModel.query.all(), [])

        response = self.client.delete(
            f'/api/projects/{TEST_PROJECT_ID}/applications/{TEST_APPLICATION_ID}/evaluations/101')
        self.assertEqual(404, response.status_code)
        self.assertEqual(response.json, {'status': False, 'message': 'Not Found.'})


class ApiEvaluationResultTest(BaseTestCase):
    """Tests for ApiEvaluationResult.
    """
    @patch_stub
    def test_get(self):
        evaluation_model = create_eval_model(TEST_APPLICATION_ID, save=True)
        eval_result_model = create_eval_result_model(
            model_id=TEST_MODEL_ID, evaluation_id=evaluation_model.evaluation_id,
            result=json.dumps(default_metrics), save=True)
        response = self.client.get(
            f'/api/projects/{TEST_PROJECT_ID}/applications/{TEST_APPLICATION_ID}/'
            f'evaluation_results/{eval_result_model.evaluation_result_id}')
        self.assertEqual(200, response.status_code)
        self.assertEqual(response.json['status'], True)
        self.assertEqual(response.json['metrics'], dict(default_metrics, result_id=1))
        details = response.json['details']
        self.assertEqual(len(details), 4)
        self.assertEqual(
            details[0], {'input': 'input', 'label': 'test', 'output': 'test', 'score': 1.0, 'is_correct': True})
        self.assertEqual(
            details[1],
            {'input': 0.5, 'label': [0.9, 1.3], 'output': [0.9, 0.3], 'score': [0.5, 0.5], 'is_correct': False})

    @patch('rekcurd_dashboard.core.rekcurd_dashboard_client.rekcurd_pb2_grpc.RekcurdDashboardStub')
    def test_get_not_found(self, mock_stub_class):
        evaluation_model = create_eval_model(TEST_APPLICATION_ID, save=True)
        eval_result_model = create_eval_result_model(
            model_id=TEST_MODEL_ID, evaluation_id=evaluation_model.evaluation_id, save=True)
        response = self.client.get(
            f'/api/projects/{TEST_PROJECT_ID}/applications/{TEST_APPLICATION_ID}/'
            f'evaluation_results/{eval_result_model.evaluation_result_id}')
        self.assertEqual(404, response.status_code)
        self.assertEqual(response.json, {'status': False, 'message': 'Result Not Found.'})

        response = self.client.get(
            f'/api/projects/{TEST_PROJECT_ID}/applications/{TEST_APPLICATION_ID}/evaluation_results/101')
        self.assertEqual(404, response.status_code)
        self.assertEqual(response.json, {'status': False, 'message': 'Not Found.'})

    def test_delete(self):
        evaluation_model = create_eval_model(TEST_APPLICATION_ID, save=True)
        eval_result_model = create_eval_result_model(
            model_id=TEST_MODEL_ID, evaluation_id=evaluation_model.evaluation_id, save=True)
        response = self.client.delete(
            f'/api/projects/{TEST_PROJECT_ID}/applications/{TEST_APPLICATION_ID}/'
            f'evaluation_results/{eval_result_model.evaluation_result_id}')
        self.assertEqual(200, response.status_code)
        self.assertEqual(response.json, {'status': True, 'message': 'Success.'})
        self.assertEqual(EvaluationResultModel.query.all(), [])

        response = self.client.delete(
            f'/api/projects/{TEST_PROJECT_ID}/applications/{TEST_APPLICATION_ID}/evaluation_results/101')
        self.assertEqual(404, response.status_code)
        self.assertEqual(response.json, {'status': False, 'message': 'Not Found.'})


class ApiEvaluateTest(BaseTestCase):
    """Tests for ApiEvaluate.
    """
    default_response = dict(default_metrics, result_id=1, status=True)

    @patch_stub
    def test_post(self):
        evaluation_id = create_eval_model(TEST_APPLICATION_ID, save=True).evaluation_id

        # create another service to confirm that the API works with multiple candidates
        create_service_model(application_id=TEST_APPLICATION_ID, model_id=TEST_MODEL_ID,
                             service_id="new-service", display_name="new-service", save=True)

        response = self.client.post(
            f'/api/projects/{TEST_PROJECT_ID}/applications/{TEST_APPLICATION_ID}/evaluate',
            data={'evaluation_id': evaluation_id, 'model_id': TEST_MODEL_ID})
        self.assertEqual(200, response.status_code)
        self.assertEqual(response.json, self.default_response)
        evaluation_model_exists = db.session.query(EvaluationResultModel).filter(
            EvaluationResultModel.model_id == TEST_MODEL_ID,
            EvaluationResultModel.evaluation_id == evaluation_id).one_or_none() is not None
        self.assertEqual(evaluation_model_exists, True)

    @patch_stub
    def test_post_without_param(self):
        create_eval_model(TEST_APPLICATION_ID, checksum='12345', save=True)
        create_eval_model(TEST_APPLICATION_ID, checksum='6789', save=True)
        create_eval_model(TEST_APPLICATION_ID, checksum='abc', save=True)
        newest_eval_id = create_eval_model(TEST_APPLICATION_ID, save=True).evaluation_id

        response = self.client.post(
            f'/api/projects/{TEST_PROJECT_ID}/applications/{TEST_APPLICATION_ID}/evaluate',
            data={'model_id': TEST_MODEL_ID})
        self.assertEqual(200, response.status_code)
        self.assertEqual(response.json, self.default_response)
        evaluation_model_exists = db.session.query(EvaluationResultModel).filter(
            EvaluationResultModel.model_id == TEST_MODEL_ID,
            EvaluationResultModel.evaluation_id == newest_eval_id).one_or_none() is not None
        self.assertEqual(evaluation_model_exists, True)

    @patch_stub
    def test_post_duplicated(self):
        saved_response = deepcopy(self.default_response)
        evaluation_id = create_eval_model(TEST_APPLICATION_ID, save=True).evaluation_id
        create_eval_result_model(
            model_id=TEST_MODEL_ID, evaluation_id=evaluation_id, result=json.dumps(saved_response), save=True)

        url = f'/api/projects/{TEST_PROJECT_ID}/applications/{TEST_APPLICATION_ID}/evaluate'
        data = {'evaluation_id': evaluation_id, 'model_id': TEST_MODEL_ID}
        response = self.client.post(url, data=data)
        self.assertEqual(200, response.status_code)
        self.assertEqual(response.json, saved_response)

        # overwrite
        response = self.client.post(url, data=dict(data, overwrite=True))
        self.assertEqual(200, response.status_code)
        self.assertEqual(response.json, self.default_response)

        evaluation_model = db.session.query(EvaluationResultModel).filter(
            EvaluationResultModel.model_id == TEST_MODEL_ID,
            EvaluationResultModel.evaluation_id == evaluation_id).one()
        self.assertEqual(evaluation_model.result, self.default_response)

    @patch_stub
    def test_post_not_found(self):
        evaluation_id = create_eval_model(TEST_APPLICATION_ID, save=True).evaluation_id
        non_exist_model_id = 100
        response = self.client.post(
            f'/api/projects/{TEST_PROJECT_ID}/applications/{TEST_APPLICATION_ID}/evaluate',
            data={'evaluation_id': evaluation_id, 'model_id': non_exist_model_id})
        self.assertEqual(404, response.status_code)
