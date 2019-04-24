from rekcurd_dashboard.models import db, ProjectModel

from functools import wraps
from unittest.mock import patch, Mock, mock_open
from test.base import BaseTestCase, TEST_PROJECT_ID


def mock_decorator():
    """Decorator to mock for dashboard.
    """

    def test_method(func):
        @wraps(func)
        def inner_method(*args, **kwargs):
            with patch('builtins.open', new_callable=mock_open) as _, \
                    patch('rekcurd_dashboard.apis.api_project.update_kubernetes_deployment_info',
                          new=Mock(return_value=True)) as _:
                return func(*args, **kwargs)
        return inner_method
    return test_method


class ApiProjectsTest(BaseTestCase):
    __URL = '/api/projects'

    def test_get(self):
        response = self.client.get(self.__URL)
        self.assertEqual(200, response.status_code)
        self.assertIsNotNone(response)

    def test_post(self):
        display_name = 'new_project'
        description = 'test'
        use_kubernetes = False
        response = self.client.post(
            self.__URL,
            data={'display_name': display_name, 'description': description, 'use_kubernetes': use_kubernetes})
        project_model = db.session.query(ProjectModel).filter(
            ProjectModel.display_name == display_name).one_or_none()
        self.assertEqual(200, response.status_code)
        self.assertIsNotNone(project_model)


class ApiProjectIdTest(BaseTestCase):
    __URL = f'/api/projects/{TEST_PROJECT_ID}'
    __INVALID_URL = '/api/projects/1000'

    def test_get(self):
        response = self.client.get(self.__URL)
        self.assertEqual(200, response.status_code)
        self.assertIsNotNone(response)

        response = self.client.get(self.__INVALID_URL)
        self.assertEqual(404, response.status_code)

    def test_patch(self):
        display_name = 'new_project'
        description = 'test'
        use_kubernetes = True
        response = self.client.patch(
            self.__URL,
            data={'display_name': display_name, 'description': description, 'use_kubernetes': use_kubernetes})
        project_model = db.session.query(ProjectModel).filter(
            ProjectModel.project_id == TEST_PROJECT_ID, ProjectModel.display_name == display_name).one_or_none()
        self.assertEqual(200, response.status_code)
        self.assertIsNotNone(project_model)

        response = self.client.patch(self.__INVALID_URL, data={'display_name': display_name})
        self.assertEqual(404, response.status_code)

    @mock_decorator()
    def test_put(self):
        response = self.client.put(self.__URL)
        self.assertEqual(200, response.status_code)
        self.assertIsNotNone(response)
