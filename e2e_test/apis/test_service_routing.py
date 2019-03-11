from e2e_test.base import (
    BaseTestCase, TEST_PROJECT_ID, TEST_APPLICATION_ID, TEST_SERVICE_ID
)


class TestApiServiceRouting(BaseTestCase):
    __URL = f'/api/projects/{TEST_PROJECT_ID}/applications/{TEST_APPLICATION_ID}/service_routing'

    def test_get(self):
        response = self.client.get(f'{self.__URL}?service_level=development')
        self.assertEqual(200, response.status_code)

    def test_patch(self):
        service_level = "development"
        service_ids = [TEST_SERVICE_ID]
        service_weights = [100]
        response = self.client.patch(
            self.__URL,
            data={'service_level': service_level, 'service_ids': service_ids, 'service_weights': service_weights})
        self.assertEqual(200, response.status_code)
