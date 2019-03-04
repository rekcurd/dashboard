from rekcurd_dashboard.models import db, KubernetesModel

from test.base import BaseTestCase, TEST_PROJECT_ID


class ApiKubernetesTest(BaseTestCase):
    __URL = f'/api/projects/{TEST_PROJECT_ID}/kubernetes'

    def test_get(self):
        response = self.client.get(self.__URL)
        self.assertEqual(200, response.status_code)
        self.assertIsNotNone(response)
