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
                    patch('rekcurd_dashboard.apis.api_service_deployment.apply_rekcurd_to_kubernetes',
                          new=Mock(return_value=True)) as _, \
                    patch('rekcurd_dashboard.apis.api_service_deployment.load_kubernetes_deployment_info',
                          new=Mock(return_value=True)) as deployment_info, \
                    patch('rekcurd_dashboard.apis.api_service_deployment.RekcurdDashboardClient',
                          new=Mock(return_value=Mock())) as rekcurd_dashboard_application:
                deployment_info.return_value = {'version': 'vn', 'service_model_assignment': 1,
                                                'service_insecure_host': 'new_host',
                                                'service_insecure_port': 18080}
                rekcurd_dashboard_application.return_value.run_service_info = Mock()
                rekcurd_dashboard_application.return_value.run_service_info.return_value = \
                    {"service_name": "nonkube-service"}  # TODO: renaming
                return func(*args, **kwargs)
        return inner_method
    return test_method


class ApiSingleServiceRegistrationTest(BaseTestCase):
    __URL = f'/api/projects/{TEST_PROJECT_ID}/applications/{TEST_APPLICATION_ID}/single_service_registration'

    @mock_decorator()
    def test_post(self):
        display_name = 'non-kube-service'
        service_level = 'development'
        service_model_assignment = 1
        response = self.client.post(
            self.__URL, data={'display_name': display_name, 'service_level': service_level,
                              'service_model_assignment': service_model_assignment})
        service_model = db.session.query(ServiceModel).filter(
            ServiceModel.display_name == display_name).one_or_none()
        self.assertEqual(200, response.status_code)
        self.assertIsNotNone(service_model)


class ApiServiceDeploymentTest(BaseTestCase):
    __URL = f'/api/projects/{TEST_PROJECT_ID}/applications/{TEST_APPLICATION_ID}/service_deployment'

    @mock_decorator()
    def test_post(self):
        service_level = 'development'
        container_image = 'test-image'
        service_model_assignment = 1
        resource_request_cpu = 1.0
        resource_request_memory = '256Mi'
        response = self.client.post(
            self.__URL, data={'service_level': service_level, 'container_image': container_image,
                              'service_model_assignment': service_model_assignment,
                              'resource_request_cpu': resource_request_cpu,
                              'resource_request_memory': resource_request_memory})
        self.assertEqual(200, response.status_code)


class ApiServiceIdDeploymentTest(BaseTestCase):
    __URL = f'/api/projects/{TEST_PROJECT_ID}/applications/{TEST_APPLICATION_ID}/service_deployment/{TEST_SERVICE_ID}'

    @mock_decorator()
    def test_get(self):
        response = self.client.get(self.__URL)
        self.assertEqual(200, response.status_code)
        self.assertIsNotNone(response)

    @mock_decorator()
    def test_put(self):
        response = self.client.put(self.__URL)
        self.assertEqual(200, response.status_code)
        self.assertIsNotNone(response)

    @mock_decorator()
    def test_patch(self):
        service_level = 'development'
        version = 'v2'
        service_insecure_host = 'service_insecure_host'
        service_insecure_port = 5000
        replicas_default = 1
        replicas_minimum = 1
        replicas_maximum = 1
        autoscale_cpu_threshold = 80
        policy_max_surge = 1
        policy_max_unavailable = 0
        policy_wait_seconds = 300
        container_image = 'test-image'
        service_model_assignment = 1
        service_git_url = ''
        service_git_branch = ''
        service_boot_script = ''
        resource_request_cpu = 1.0
        resource_request_memory = '256Mi'
        resource_limit_cpu = 1.0
        resource_limit_memory = '256Mi'
        response = self.client.patch(
            self.__URL, data={'service_level': service_level, 'version': version,
                              'service_insecure_host': service_insecure_host,
                              'service_insecure_port': service_insecure_port,
                              'replicas_default': replicas_default, 'replicas_minimum': replicas_minimum,
                              'replicas_maximum': replicas_maximum, 'autoscale_cpu_threshold': autoscale_cpu_threshold,
                              'policy_max_surge': policy_max_surge, 'policy_max_unavailable': policy_max_unavailable,
                              'policy_wait_seconds': policy_wait_seconds, 'container_image': container_image,
                              'service_model_assignment': service_model_assignment,
                              'service_git_url': service_git_url, 'service_git_branch': service_git_branch,
                              'service_boot_script': service_boot_script, 'resource_request_cpu': resource_request_cpu,
                              'resource_request_memory': resource_request_memory,
                              'resource_limit_cpu': resource_limit_cpu, 'resource_limit_memory': resource_limit_memory})
        self.assertEqual(200, response.status_code)
