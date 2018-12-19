from unittest.mock import patch, Mock
from copy import deepcopy
import json

import drucker_pb2
from .base import BaseTestCase, create_app_obj, create_service_obj, create_eval_obj, create_eval_result_obj
from models import EvaluationResult, db


def patch_stub(func):
    def inner_method(*args, **kwargs):
        mock_stub_obj = Mock()
        mock_stub_obj.EvaluateModel.return_value = drucker_pb2.EvaluateModelResponse()
        with patch('core.drucker_dashboard_client.drucker_pb2_grpc.DruckerDashboardStub',
                   new=Mock(return_value=mock_stub_obj)):
            return func(*args, **kwargs)
    return inner_method


class ApiEvaluateTest(BaseTestCase):
    """Tests for ApiEvaluate.
    """
    default_response = {'accuracy': 0.0, 'fvalue': 0.0, 'num': 0,
                        'option': {}, 'precision': 0.0, 'recall': 0.0, 'status': True}

    def setUp(self):
        super().setUp()

    @patch_stub
    def test_post(self):
        aobj = create_app_obj()
        sobj = create_service_obj(aobj.application_id)
        model_id = sobj.model_id
        evaluation_id = create_eval_obj(aobj.application_id, save=True).evaluation_id

        response = self.client.post(f'/api/applications/{aobj.application_id}/services/{sobj.service_id}/evaluate',
                                    data={'evaluation_id': evaluation_id})
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

        response = self.client.post(f'/api/applications/{aobj.application_id}/services/{sobj.service_id}/evaluate')
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

        url = f'/api/applications/{aobj.application_id}/services/{sobj.service_id}/evaluate'
        response = self.client.post(url, data={'evaluation_id': evaluation_id})
        self.assertEqual(200, response.status_code)
        self.assertEqual(response.json, saved_response)

        # overwrite
        response = self.client.post(url, data={'evaluation_id': evaluation_id, 'overwrite': True})
        self.assertEqual(200, response.status_code)
        self.assertEqual(response.json, self.default_response)

        eobj = db.session.query(EvaluationResult)\
            .filter(EvaluationResult.model_id == model_id,
                    EvaluationResult.evaluation_id == evaluation_id).one()
        self.assertEqual(json.loads(eobj.result), self.default_response)
