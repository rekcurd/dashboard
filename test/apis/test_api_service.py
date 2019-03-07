from functools import wraps
from unittest.mock import patch, Mock, mock_open

from rekcurd_dashboard.apis import RekcurdDashboardException
from rekcurd_dashboard.models import db, ServiceModel, DataServerModel, DataServerModeEnum

from test.base import (
    BaseTestCase, TEST_PROJECT_ID, TEST_APPLICATION_ID, TEST_SERVICE_ID, TEST_MODEL_ID,
    create_model_model, create_data_server_model, create_kubernetes_model
)


def mock_decorator():
    """Decorator to mock for dashboard.
    """

    def test_method(func):
        @wraps(func)
        def inner_method(*args, **kwargs):
            with patch('builtins.open', new_callable=mock_open) as _, \
                    patch('rekcurd_dashboard.apis.api_service.switch_model_assignment',
                          new=Mock(return_value={"status": True, "message": "Success."})) as _, \
                    patch('rekcurd_dashboard.apis.api_service.delete_kubernetes_deployment',
                          new=Mock(return_value=True)) as _, \
                    patch('rekcurd_dashboard.apis.api_service.RekcurdDashboardClient',
                          new=Mock(return_value=Mock())) as rekcurd_dashboard_application:
                rekcurd_dashboard_application.return_value.run_switch_service_model_assignment = Mock()
                rekcurd_dashboard_application.return_value.run_switch_service_model_assignment.return_value = \
                    {"status": True, "message": "Success."}
                return func(*args, **kwargs)
        return inner_method
    return test_method


class ApiServicesTest(BaseTestCase):
    __URL = f'/api/projects/{TEST_PROJECT_ID}/applications/{TEST_APPLICATION_ID}/services'

    def test_get(self):
        response = self.client.get(self.__URL)
        self.assertEqual(200, response.status_code)
        self.assertIsNotNone(response)


class ApiServiceIdTest(BaseTestCase):
    __URL = f'/api/projects/{TEST_PROJECT_ID}/applications/{TEST_APPLICATION_ID}/services/{TEST_SERVICE_ID}'

    def test_get(self):
        response = self.client.get(self.__URL)
        self.assertEqual(200, response.status_code)
        self.assertIsNotNone(response)

    @mock_decorator()
    def test_put(self):
        model_id = 2
        create_data_server_model(save=True)
        create_model_model(model_id=model_id, file_path="rekcurd-test-model/new.model", description="new", save=True)

        response = self.client.put(self.__URL, data={'model_id': TEST_MODEL_ID})
        self.assertEqual(400, response.status_code)

        response = self.client.put(self.__URL, data={'model_id': model_id})
        self.assertEqual(200, response.status_code)

        DataServerModel.query.filter(DataServerModel.project_id == TEST_PROJECT_ID).delete()
        create_data_server_model(mode=DataServerModeEnum.CEPH_S3, save=True)
        create_kubernetes_model(save=True)
        response = self.client.put(self.__URL, data={'model_id': TEST_MODEL_ID})
        self.assertEqual(200, response.status_code)

    @mock_decorator()
    def test_patch(self):
        display_name = "new_service"
        response = self.client.patch(
            self.__URL, data={'display_name': display_name, 'description': 'new_test', 'version': 'v1'})
        service_model = db.session.query(ServiceModel).filter(
            ServiceModel.service_id == TEST_SERVICE_ID, ServiceModel.display_name == display_name).one_or_none()
        self.assertEqual(200, response.status_code)
        self.assertIsNotNone(service_model)

    @mock_decorator()
    def test_delete(self):
        response = self.client.delete(self.__URL)
        self.assertEqual(200, response.status_code)
        self.assertIsNotNone(response)

