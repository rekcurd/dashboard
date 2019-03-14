from rekcurd_dashboard.models import db, ApplicationModel

from test.base import BaseTestCase, TEST_PROJECT_ID, TEST_APPLICATION_ID


class ApiApplicationsTest(BaseTestCase):
    __URL = f'/api/projects/{TEST_PROJECT_ID}/applications'

    def test_get(self):
        response = self.client.get(self.__URL)
        self.assertEqual(200, response.status_code)
        self.assertIsNotNone(response)

    def test_post(self):
        application_name = 'new_app'
        response = self.client.post(self.__URL, data={'application_name': application_name, 'description': 'test'})
        application_model = db.session.query(ApplicationModel).filter(
            ApplicationModel.application_name == application_name).one_or_none()
        self.assertEqual(200, response.status_code)
        self.assertIsNotNone(application_model)

        response = self.client.post(self.__URL, data={'application_name': application_name, 'description': 'test'})
        self.assertEqual(400, response.status_code)


class ApiApplicationIdTest(BaseTestCase):
    __URL = f'/api/projects/{TEST_PROJECT_ID}/applications/{TEST_APPLICATION_ID}'
    __INVALID_URL = f'/api/projects/{TEST_PROJECT_ID}/applications/xxxxx'

    def test_get(self):
        response = self.client.get(self.__URL)
        self.assertEqual(200, response.status_code)
        self.assertIsNotNone(response)

        response = self.client.get(self.__INVALID_URL)
        self.assertEqual(404, response.status_code)

    def test_patch(self):
        description = 'new_description'
        response = self.client.patch(self.__URL, data={'description': description})
        application_model = db.session.query(ApplicationModel).filter(
            ApplicationModel.application_id == TEST_APPLICATION_ID,
            ApplicationModel.description == description).one_or_none()
        self.assertEqual(200, response.status_code)
        self.assertIsNotNone(application_model)

        response = self.client.patch(self.__INVALID_URL, data={'description': description})
        self.assertEqual(404, response.status_code)

    def test_delete(self):
        response = self.client.delete(self.__URL)
        self.assertEqual(200, response.status_code)

        response = self.client.delete(self.__INVALID_URL)
        self.assertEqual(404, response.status_code)

