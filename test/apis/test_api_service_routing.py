import json

from functools import wraps
from unittest.mock import patch, Mock, mock_open

from test.base import BaseTestCase, TEST_PROJECT_ID, TEST_APPLICATION_ID, TEST_SERVICE_ID


def mock_decorator():
    """Decorator to mock for dashboard.
    """

    def test_method(func):
        @wraps(func)
        def inner_method(*args, **kwargs):
            with patch('builtins.open', new_callable=mock_open) as _, \
                    patch('rekcurd_dashboard.apis.api_service_routing.apply_new_route_weight',
                          new=Mock(return_value=True)) as _, \
                    patch('rekcurd_dashboard.apis.api_service_routing.load_istio_routing',
                          new=Mock(return_value=True)) as routes:
                routes.return_value = [
                    {
                        'destination': {
                            'host': f'svc-{TEST_SERVICE_ID}'
                        },
                        'weight': 50
                    }
                ]
                return func(*args, **kwargs)
        return inner_method
    return test_method


class ApiServiceRoutingTest(BaseTestCase):
    __URL = f'/api/projects/{TEST_PROJECT_ID}/applications/{TEST_APPLICATION_ID}/service_routing'

    @mock_decorator()
    def test_get(self):
        response = self.client.get(self.__URL+'?service_level=development')
        self.assertEqual(200, response.status_code)
        self.assertIsNotNone(response)

    @mock_decorator()
    def test_patch(self):
        service_level = 'development'
        service_weights = [{'service_id': TEST_SERVICE_ID, 'service_weight': 100}]
        response = self.client.patch(
            self.__URL,
            data=json.dumps({'service_level': service_level, 'service_weights': service_weights}),
            content_type='application/json')
        self.assertEqual(200, response.status_code)
