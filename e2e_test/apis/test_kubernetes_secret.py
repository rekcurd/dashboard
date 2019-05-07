from rekcurd_dashboard.apis import GIT_ID_RSA, GIT_CONFIG

from e2e_test.base import (
    BaseTestCase, TEST_PROJECT_ID, TEST_APPLICATION_ID
)


SERVICE_LEVEL = 'development'


class TestApiGitKey(BaseTestCase):
    __URL = f'/api/projects/{TEST_PROJECT_ID}/applications/{TEST_APPLICATION_ID}/git_key'
    __URL_DELETE = f'/api/projects/{TEST_PROJECT_ID}/applications/{TEST_APPLICATION_ID}/service_levels/{SERVICE_LEVEL}/git_key'

    def test_get(self):
        response = self.client.get(f'{self.__URL}?service_level={SERVICE_LEVEL}')
        self.assertEqual(400, response.status_code)

    def test_post(self):
        service_level = SERVICE_LEVEL
        git_id_rsa = 'new_id_rsa'
        git_config = 'new_config'
        response = self.client.post(
            self.__URL,
            data={'service_level': service_level, GIT_ID_RSA: git_id_rsa, GIT_CONFIG: git_config})
        self.assertEqual(200, response.status_code)

        response = self.client.get(f'{self.__URL}?service_level={SERVICE_LEVEL}')
        self.assertEqual(200, response.status_code)
        self.client.delete(self.__URL_DELETE)

    def test_patch(self):
        service_level = SERVICE_LEVEL
        git_id_rsa = 'id_rsa'
        git_config = 'config'
        response = self.client.post(
            self.__URL,
            data={'service_level': service_level, GIT_ID_RSA: git_id_rsa, GIT_CONFIG: git_config})
        self.assertEqual(200, response.status_code)

        service_level = SERVICE_LEVEL
        git_id_rsa = 'new_id_rsa'
        git_config = 'new_config'
        response = self.client.patch(
            self.__URL,
            data={'service_level': service_level, GIT_ID_RSA: git_id_rsa, GIT_CONFIG: git_config})
        self.assertEqual(200, response.status_code)
        self.client.delete(self.__URL_DELETE)


class TestApiGitKeyDelete(BaseTestCase):
    __URL_POST = f'/api/projects/{TEST_PROJECT_ID}/applications/{TEST_APPLICATION_ID}/git_key'
    __URL = f'/api/projects/{TEST_PROJECT_ID}/applications/{TEST_APPLICATION_ID}/service_levels/{SERVICE_LEVEL}/git_key'

    def test_delete(self):
        service_level = SERVICE_LEVEL
        git_id_rsa = 'new_id_rsa'
        git_config = 'new_config'
        response = self.client.post(
            self.__URL_POST,
            data={'service_level': service_level, GIT_ID_RSA: git_id_rsa, GIT_CONFIG: git_config})
        self.assertEqual(200, response.status_code)

        response = self.client.delete(self.__URL)
        self.assertEqual(200, response.status_code)
