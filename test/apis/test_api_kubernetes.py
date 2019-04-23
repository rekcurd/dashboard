from functools import wraps
from unittest.mock import patch, Mock, mock_open

from rekcurd_dashboard.models import db, KubernetesModel

from test.base import BaseTestCase, TEST_PROJECT_ID


def mock_decorator():
    """Decorator to mock for dashboard.
    """

    def test_method(func):
        @wraps(func)
        def inner_method(*args, **kwargs):
            with patch('builtins.open', new_callable=mock_open) as _, \
                    patch('rekcurd_dashboard.apis.api_kubernetes.update_kubernetes_deployment_info',
                          new=Mock(return_value=True)) as _, \
                    patch('rekcurd_dashboard.apis.api_kubernetes.check_kubernetes_configfile',
                          new=Mock(return_value=True)) as _, \
                    patch('rekcurd_dashboard.apis.api_kubernetes.save_kubernetes_access_file',
                          new=Mock(return_value=True)) as _, \
                    patch('rekcurd_dashboard.apis.api_kubernetes.remove_kubernetes_access_file',
                          new=Mock(return_value=True)) as _, \
                    patch('rekcurd_dashboard.apis.api_kubernetes.backup_kubernetes_deployment',
                          new=Mock(return_value=True)) as _, \
                    patch('rekcurd_dashboard.apis.api_kubernetes.backup_istio_routing',
                          new=Mock(return_value=True)) as _:
                return func(*args, **kwargs)
        return inner_method
    return test_method


class ApiKubernetesTest(BaseTestCase):
    __URL = f'/api/projects/{TEST_PROJECT_ID}/kubernetes'

    def test_get(self):
        response = self.client.get(self.__URL)
        self.assertEqual(200, response.status_code)
        self.assertIsNotNone(response)

    @mock_decorator()
    def test_post(self):
        display_name = 'new_kube'
        dummy_file = 'test/dummy'
        response = self.client.post(
            self.__URL,
            data={'file': (open(dummy_file, 'rb'), dummy_file),
                  'display_name': display_name, 'description': 'test',
                  'exposed_host': 'localhost', 'exposed_port': 80})
        kubernetes_model = db.session.query(KubernetesModel).filter(
            KubernetesModel.display_name == display_name).one_or_none()
        self.assertEqual(200, response.status_code)
        self.assertIsNotNone(kubernetes_model)


class ApiKubernetesBackupTest(BaseTestCase):
    __URL = f'/api/projects/{TEST_PROJECT_ID}/backup'

    @mock_decorator()
    def test_post(self):
        response = self.client.post(self.__URL)
        self.assertEqual(200, response.status_code)


class ApiKubernetesIdTest(BaseTestCase):
    __PREPARE_URL = f'/api/projects/{TEST_PROJECT_ID}/kubernetes'
    __URL = f'/api/projects/{TEST_PROJECT_ID}/kubernetes/1'

    @mock_decorator()
    def test_get(self):
        response = self.client.get(self.__URL)
        self.assertEqual(404, response.status_code)

        self.client.post(
            self.__PREPARE_URL,
            data={'file': (open('test/dummy', 'rb'), 'test/dummy'),
                  'display_name': 'new_kube', 'description': 'test',
                  'exposed_host': 'localhost', 'exposed_port': 80})
        response = self.client.get(self.__URL)
        self.assertEqual(200, response.status_code)

    @mock_decorator()
    def test_patch(self):
        self.client.post(
            self.__PREPARE_URL,
            data={'file': (open('test/dummy', 'rb'), 'test/dummy'),
                  'display_name': 'new_kube', 'description': 'test',
                  'exposed_host': 'localhost', 'exposed_port': 80})
        response = self.client.patch(
            self.__URL,
            data={'file': (open('test/dummy', 'rb'), 'test/dummy'),
                  'display_name': 'new_kube2', 'description': 'test',
                  'exposed_host': 'localhost', 'exposed_port': 80})
        kubernetes_model = db.session.query(KubernetesModel).filter(
            KubernetesModel.display_name == 'new_kube2').one_or_none()
        self.assertEqual(200, response.status_code)
        self.assertIsNotNone(kubernetes_model)

    @mock_decorator()
    def test_delete(self):
        self.client.post(
            self.__PREPARE_URL,
            data={'file': (open('test/dummy', 'rb'), 'test/dummy'),
                  'display_name': 'new_kube', 'description': 'test',
                  'exposed_host': 'localhost', 'exposed_port': 80})
        response = self.client.delete(self.__URL)
        self.assertEqual(200, response.status_code)
        self.assertIsNotNone(response)

