from rekcurd_dashboard.models import db, ProjectModel

from test.base import BaseTestCase, TEST_PROJECT_ID


class ApiProjectsTest(BaseTestCase):
    __URL = '/api/projects'

    def test_get(self):
        response = self.client.get(self.__URL)
        self.assertEqual(200, response.status_code)
        self.assertIsNotNone(response)

    def test_post(self):
        display_name = 'new_project'
        response = self.client.post(self.__URL, data={'display_name': display_name, 'description': 'test'})
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
        response = self.client.patch(self.__URL, data={'display_name': display_name})
        project_model = db.session.query(ProjectModel).filter(
            ProjectModel.project_id == TEST_PROJECT_ID, ProjectModel.display_name == display_name).one_or_none()
        self.assertEqual(200, response.status_code)
        self.assertIsNotNone(project_model)

        response = self.client.patch(self.__INVALID_URL, data={'display_name': display_name})
        self.assertEqual(500, response.status_code)
