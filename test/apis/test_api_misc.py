from test.base import BaseTestCase


class ApiSettingsTest(BaseTestCase):
    __URL = '/api/settings'

    def setUp(self):
        pass

    def test_get(self):
        response = self.client.get(self.__URL)
        self.assertEqual(200, response.status_code)
        self.assertIsNotNone(response)
