from functools import wraps
from unittest.mock import patch, Mock, mock_open

from rekcurd_dashboard.models import db, ServiceModel

from test.base import BaseTestCase, TEST_PROJECT_ID, TEST_APPLICATION_ID, TEST_SERVICE_ID


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
                          new=Mock(return_value=True)) as _:
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
        response = self.client.put(self.__URL, data={'model_id': 2})
        self.assertEqual(200, response.status_code)
        self.assertIsNotNone(response)

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

