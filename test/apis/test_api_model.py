from functools import wraps
from unittest.mock import patch, Mock, mock_open

from rekcurd_dashboard.models import db, ModelModel, DataServerModel, DataServerModeEnum, ServiceModel

from test.base import BaseTestCase, TEST_PROJECT_ID, TEST_APPLICATION_ID, TEST_MODEL_ID, create_data_server_model


def mock_decorator():
    """Decorator to mock for dashboard.
    """

    def test_method(func):
        @wraps(func)
        def inner_method(*args, **kwargs):
            with patch('builtins.open', new_callable=mock_open) as _, \
                    patch('rekcurd_dashboard.apis.api_model.DataServer',
                          new=Mock(return_value=Mock())) as data_server, \
                    patch('rekcurd_dashboard.apis.api_model.RekcurdDashboardClient',
                          new=Mock(return_value=Mock())) as rekcurd_dashboard_application:
                data_server.return_value.upload_model = Mock()
                data_server.return_value.upload_model.return_value = "filepath"
                rekcurd_dashboard_application.return_value.run_upload_model = Mock()
                rekcurd_dashboard_application.return_value.run_upload_model.return_value = \
                    {"status": True, "message": "Success."}
                return func(*args, **kwargs)
        return inner_method
    return test_method


class ApiModelsTest(BaseTestCase):
    __URL = f'/api/projects/{TEST_PROJECT_ID}/applications/{TEST_APPLICATION_ID}/models'

    def setUp(self):
        super().setUp()
        create_data_server_model(save=True)

    def test_get(self):
        response = self.client.get(self.__URL)
        self.assertEqual(200, response.status_code)
        self.assertIsNotNone(response)

    @mock_decorator()
    def test_post(self):
        description = 'test'
        dummy_file = 'test/dummy'
        response = self.client.post(
            self.__URL, data={'filepath': (open(dummy_file, 'rb'), dummy_file), 'description': description})
        model_model = db.session.query(ModelModel).filter(
            ModelModel.description == description).one_or_none()
        self.assertEqual(200, response.status_code)
        self.assertIsNotNone(model_model)

        DataServerModel.query.filter(DataServerModel.project_id == TEST_PROJECT_ID).delete()
        create_data_server_model(mode=DataServerModeEnum.CEPH_S3, save=True)
        response = self.client.post(
            self.__URL, data={'filepath': (open(dummy_file, 'rb'), dummy_file), 'description': description})
        self.assertEqual(200, response.status_code)


class ApiModelIdTest(BaseTestCase):
    __URL = f'/api/projects/{TEST_PROJECT_ID}/applications/{TEST_APPLICATION_ID}/models/{TEST_MODEL_ID}'

    def test_get(self):
        response = self.client.get(self.__URL)
        self.assertEqual(200, response.status_code)
        self.assertIsNotNone(response)

    def test_patch(self):
        description = 'new_description'
        response = self.client.patch(
            self.__URL, data={'description': description})
        model_model = db.session.query(ModelModel).filter(
            ModelModel.description == description).one_or_none()
        self.assertEqual(200, response.status_code)
        self.assertIsNotNone(model_model)

    def test_delete(self):
        response = self.client.delete(self.__URL)
        self.assertEqual(400, response.status_code)

        ServiceModel.query.filter(ServiceModel.application_id == TEST_APPLICATION_ID).delete()
        response = self.client.delete(self.__URL)
        self.assertEqual(200, response.status_code)
