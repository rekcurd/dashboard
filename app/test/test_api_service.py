from unittest.mock import patch, Mock

import drucker_pb2
from .base import BaseTestCase, create_app_obj, create_service_obj, create_eval_obj
from models import EvaluationResult, db


class ApiEvaluateTest(BaseTestCase):
    """Tests for ApiEvaluate.
    """

    @patch('core.drucker_dashboard_client.drucker_pb2_grpc.DruckerDashboardStub')
    def test_post(self, mock_stub_class):
        mock_stub_obj = Mock()
        mock_stub_obj.EvaluateModel.return_value = drucker_pb2.EvaluateModelResponse()
        mock_stub_class.return_value = mock_stub_obj
        aobj = create_app_obj()
        sobj = create_service_obj(aobj.application_id)
        model_id = sobj.model_id
        evaluation_id = create_eval_obj(aobj.application_id, save=True).evaluation_id

        response = self.client.post(f'/api/applications/{aobj.application_id}/services/{sobj.service_id}/evaluate',
                                    data={'evaluation_id': evaluation_id})
        self.assertEqual(200, response.status_code)
        self.assertEqual(response.json, {'accuracy': 0.0, 'fvalue': 0.0, 'num': 0,
                                         'option': {}, 'precision': 0.0, 'recall': 0.0, 'status': True})
        eobj_exists = db.session.query(EvaluationResult)\
            .filter(EvaluationResult.model_id == model_id,
                    EvaluationResult.evaluation_id == evaluation_id).one_or_none() is not None
        self.assertEqual(eobj_exists, True)

    @patch('core.drucker_dashboard_client.drucker_pb2_grpc.DruckerDashboardStub')
    def test_post_without_param(self, mock_stub_class):
        mock_stub_obj = Mock()
        mock_stub_obj.EvaluateModel.return_value = drucker_pb2.EvaluateModelResponse()
        mock_stub_class.return_value = mock_stub_obj
        aobj = create_app_obj()
        sobj = create_service_obj(aobj.application_id)
        model_id = sobj.model_id
        create_eval_obj(aobj.application_id, save=True)
        create_eval_obj(aobj.application_id, save=True)
        create_eval_obj(aobj.application_id, save=True)
        newest_eval_id = create_eval_obj(aobj.application_id, save=True).evaluation_id

        response = self.client.post(f'/api/applications/{aobj.application_id}/services/{sobj.service_id}/evaluate')
        self.assertEqual(200, response.status_code)
        self.assertEqual(response.json, {'accuracy': 0.0, 'fvalue': 0.0, 'num': 0,
                                         'option': {}, 'precision': 0.0, 'recall': 0.0, 'status': True})
        eobj_exists = db.session.query(EvaluationResult)\
            .filter(EvaluationResult.model_id == model_id,
                    EvaluationResult.evaluation_id == newest_eval_id).one_or_none() is not None
        self.assertEqual(eobj_exists, True)
