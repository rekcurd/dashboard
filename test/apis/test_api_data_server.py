from rekcurd_dashboard.models import db, DataServerModel, DataServerModeEnum

from test.base import BaseTestCase, TEST_PROJECT_ID


class ApiDataServersTest(BaseTestCase):
    __URL = f'/api/projects/{TEST_PROJECT_ID}/data_servers'

    def test_get(self):
        response = self.client.get(self.__URL)
        self.assertEqual(404, response.status_code)

    def test_post(self):
        data_server_mode = DataServerModeEnum.LOCAL.value
        response = self.client.post(self.__URL, data={'data_server_mode': data_server_mode})
        self.assertEqual(200, response.status_code)
        data_server_model = db.session.query(DataServerModel).filter(
            DataServerModel.project_id == TEST_PROJECT_ID).one_or_none()
        self.assertIsNotNone(data_server_model)

        data_server_mode = DataServerModeEnum.LOCAL.value
        response = self.client.post(self.__URL, data={'data_server_mode': data_server_mode})
        self.assertEqual(400, response.status_code)

        response = self.client.get(self.__URL)
        self.assertEqual(200, response.status_code)

    def test_patch(self):
        data_server_mode = DataServerModeEnum.CEPH_S3.value
        response = self.client.post(self.__URL, data={'data_server_mode': data_server_mode})
        self.assertEqual(400, response.status_code)

        response = self.client.post(
            self.__URL,
            data={'data_server_mode': data_server_mode, 'ceph_access_key': "xxx", 'ceph_secret_key': "xxx",
                  'ceph_host': 'xxx', 'ceph_port': 80, 'ceph_is_secure': False, 'ceph_bucket_name': "xxx"})
        self.assertEqual(200, response.status_code)

        response = self.client.patch(self.__URL, data={'data_server_mode': DataServerModeEnum.LOCAL.value})
        self.assertEqual(200, response.status_code)

        response = self.client.patch(self.__URL, data={'data_server_mode': data_server_mode})
        self.assertEqual(400, response.status_code)

        response = self.client.patch(
            self.__URL,
            data={'data_server_mode': data_server_mode, 'ceph_access_key': "xxx", 'ceph_secret_key': "xxx",
                  'ceph_host': 'xxx', 'ceph_port': 80, 'ceph_is_secure': False, 'ceph_bucket_name': "xxx"})
        self.assertEqual(200, response.status_code)

        response = self.client.patch(self.__URL, data={'data_server_mode': DataServerModeEnum.AWS_S3.value})
        self.assertEqual(400, response.status_code)

        response = self.client.patch(
            self.__URL,
            data={'data_server_mode': DataServerModeEnum.AWS_S3.value,
                  'aws_access_key': "xxx", 'aws_secret_key': "xxx", 'aws_bucket_name': "xxx"})
        self.assertEqual(200, response.status_code)

    def test_delete(self):
        data_server_mode = DataServerModeEnum.AWS_S3.value
        response = self.client.post(self.__URL, data={'data_server_mode': data_server_mode})
        self.assertEqual(400, response.status_code)

        response = self.client.post(
            self.__URL,
            data={'data_server_mode': data_server_mode,
                  'aws_access_key': "xxx", 'aws_secret_key': "xxx", 'aws_bucket_name': "xxx"})
        self.assertEqual(200, response.status_code)

        response = self.client.delete(self.__URL)
        self.assertEqual(200, response.status_code)
