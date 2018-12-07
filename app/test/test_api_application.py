from unittest.mock import patch, Mock

import drucker_pb2
from .base import BaseTestCase, create_app_obj, create_service_obj, create_eval_obj
from io import BytesIO
from models import db, EvaluationResult, Evaluation


class ApiEvaluationTest(BaseTestCase):
    """Tests for ApiEvaluation.
    """

    @patch('core.drucker_dashboard_client.drucker_pb2_grpc.DruckerDashboardStub')
    def test_post(self, mock_stub_class):
        mock_stub_obj = Mock()
        mock_stub_obj.UploadEvaluationData.return_value = drucker_pb2.UploadEvaluationDataResponse(status=1, message='success')
        mock_stub_class.return_value = mock_stub_obj
        aobj = create_app_obj()
        create_service_obj(aobj.application_id)
        response = self.client.post(f'/api/applications/{aobj.application_id}/evaluation',
                                    content_type='multipart/form-data',
                                    data=dict(file=(BytesIO(b'my file contents'), "work_order.123")))
        self.assertEqual(200, response.status_code)
        self.assertEqual(response.json, {'status': True, 'evaluation_id': 1})

    def test_delete(self):
        app_id = create_app_obj().application_id
        eobj = create_eval_obj(app_id, save=True)
        sobj = create_service_obj(app_id)
        robj = EvaluationResult(service_id=sobj.service_id,
                                data_path='my_result_path',
                                evaluation_id=eobj.evaluation_id)
        db.session.add(robj)
        db.session.commit()
        response = self.client.delete(f'/api/applications/{app_id}/evaluation/{eobj.evaluation_id}')
        self.assertEqual(200, response.status_code)
        self.assertEqual(response.json, {'status': True, 'message': 'Success.'})
        self.assertEqual(Evaluation.query.all(), [])
        self.assertEqual(EvaluationResult.query.all(), [])

        response = self.client.delete(f'/api/applications/{app_id}/evaluation/101')
        self.assertEqual(404, response.status_code)
        self.assertEqual(response.json, {'status': False})
