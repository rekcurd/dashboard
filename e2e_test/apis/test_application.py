from e2e_test.base import BaseTestCase, TEST_PROJECT_ID, TEST_APPLICATION_ID


class TestApiApplicationId(BaseTestCase):
    __URL = f'/api/projects/{TEST_PROJECT_ID}/applications/{TEST_APPLICATION_ID}'

    def test_delete(self):
        response = self.client.delete(self.__URL)
        self.assertEqual(200, response.status_code)

        response = self.client.delete(self.__URL)
        self.assertEqual(404, response.status_code)
