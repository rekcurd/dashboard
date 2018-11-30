from unittest.mock import patch, Mock

import drucker_pb2
from .base import BaseTestCase, create_app_obj, create_service_obj
from io import BytesIO


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
        response = self.client.post(f'/api/applications/{aobj.application_id}/services/{sobj.service_id}/evaluate',
                                    content_type='multipart/form-data',
                                    data=dict(file=(BytesIO(b'my file contents'), "work_order.123")))
        self.assertEqual(200, response.status_code)
        self.assertEqual(response.json, {'accuracy': 0.0, 'fvalue': 0.0, 'num': 0,
                                         'option': {}, 'precision': 0.0, 'recall': 0.0, 'status': True})
