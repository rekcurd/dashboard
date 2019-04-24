from functools import wraps
from unittest.mock import patch, Mock, mock_open

from rekcurd_dashboard.apis import GIT_ID_RSA, GIT_CONFIG

from test.base import BaseTestCase, TEST_PROJECT_ID, TEST_APPLICATION_ID


def mock_decorator():
    """Decorator to mock for dashboard.
    """

    def test_method(func):
        @wraps(func)
        def inner_method(*args, **kwargs):
            with patch('builtins.open', new_callable=mock_open) as _, \
                    patch('rekcurd_dashboard.apis.api_kubernetes_secret.apply_secret',
                          new=Mock(return_value=True)) as _, \
                    patch('rekcurd_dashboard.apis.api_kubernetes_secret.load_secret',
                          new=Mock(return_value=True)) as string_data:
                string_data.return_value = {}
                return func(*args, **kwargs)
        return inner_method
    return test_method


class ApiGitKeyTest(BaseTestCase):
    __URL = f'/api/projects/{TEST_PROJECT_ID}/applications/{TEST_APPLICATION_ID}/git_key'

    @mock_decorator()
    def test_get(self):
        response = self.client.get(self.__URL+'?service_level=development')
        self.assertEqual(200, response.status_code)
        self.assertIsNotNone(response)

    @mock_decorator()
    def test_post(self):
        service_level = 'development'
        git_id_rsa = 'id_rsa'
        git_config = 'config'
        response = self.client.post(
            self.__URL,
            data={'service_level': service_level, GIT_ID_RSA: git_id_rsa, GIT_CONFIG: git_config})
        self.assertEqual(200, response.status_code)

    @mock_decorator()
    def test_patch(self):
        service_level = 'development'
        git_id_rsa = 'id_rsa'
        git_config = 'config'
        response = self.client.post(
            self.__URL,
            data={'service_level': service_level, GIT_ID_RSA: git_id_rsa, GIT_CONFIG: git_config})
        self.assertEqual(200, response.status_code)

        git_id_rsa = 'new_id_rsa'
        git_config = 'new_config'
        response = self.client.patch(
            self.__URL,
            data={'service_level': service_level, GIT_ID_RSA: git_id_rsa, GIT_CONFIG: git_config})
        self.assertEqual(200, response.status_code)


class ApiGitKeyDeleteTest(BaseTestCase):
    __URL_POST = f'/api/projects/{TEST_PROJECT_ID}/applications/{TEST_APPLICATION_ID}/git_key'
    __URL = f'/api/projects/{TEST_PROJECT_ID}/applications/{TEST_APPLICATION_ID}/service_levels/development/git_key'

    @mock_decorator()
    def test_delete(self):
        service_level = 'development'
        git_id_rsa = 'id_rsa'
        git_config = 'config'
        response = self.client.post(
            self.__URL_POST,
            data={'service_level': service_level, GIT_ID_RSA: git_id_rsa, GIT_CONFIG: git_config})
        self.assertEqual(200, response.status_code)

        response = self.client.delete(self.__URL)
        self.assertEqual(200, response.status_code)
        self.assertIsNotNone(response)

