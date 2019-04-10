import unittest

from rekcurd_dashboard.models import DataServerModel, DataServerModeEnum, ApplicationModel
from rekcurd_dashboard.data_servers import DataServer, LocalHandler, CephHandler, AwsS3Handler

from . import patch_predictor


class DataServerTest(unittest.TestCase):
    """Tests for DataServer.
    """

    def setUp(self):
        self.data_server_model_local = DataServerModel(
            project_id=1, data_server_mode=DataServerModeEnum.LOCAL)
        self.data_server_model_ceph = DataServerModel(
            project_id=1, data_server_mode=DataServerModeEnum.CEPH_S3,
            ceph_host="127.0.0.1", ceph_port=443, ceph_access_key="xxx",
            ceph_secret_key="xxx", ceph_is_secure=True, ceph_bucket_name="xxx")
        self.data_server_model_aws = DataServerModel(
            project_id=1, data_server_mode=DataServerModeEnum.AWS_S3,
            aws_access_key="xxx", aws_secret_key="xxx", aws_bucket_name="xxx")
        self.application_model = ApplicationModel(
            application_id="test", project_id=1, application_name="test", description="test")
        self.local_filepath = "test.data"
        self.data_server = DataServer()

    @patch_predictor()
    def test_get_handler_local(self):
        handler = self.data_server._get_handler(self.data_server_model_local)
        self.assertTrue(isinstance(handler, LocalHandler))

    @patch_predictor()
    def test_get_handler_ceph(self):
        handler = self.data_server._get_handler(self.data_server_model_ceph)
        self.assertTrue(isinstance(handler, CephHandler))

    @patch_predictor()
    def test_get_handler_aws(self):
        handler = self.data_server._get_handler(self.data_server_model_aws)
        self.assertTrue(isinstance(handler, AwsS3Handler))

    @patch_predictor()
    def test_get_handler_invalid(self):
        data_server_model_invalid = DataServerModel(
            project_id=1, data_server_mode=1000)
        with self.assertRaises(ValueError):
            self.data_server._get_handler(data_server_model_invalid)

    @patch_predictor()
    def test_upload_model(self):
        self.assertIsNotNone(self.data_server.upload_model(
            self.data_server_model_local, self.application_model, self.local_filepath))

    @patch_predictor()
    def test_upload_evaluation_data(self):
        self.assertIsNotNone(self.data_server.upload_evaluation_data(
            self.data_server_model_local, self.application_model, self.local_filepath))

    @patch_predictor()
    def test_delete_file(self):
        self.assertIsNotNone(self.data_server.upload_evaluation_data(
            self.data_server_model_local, self.application_model, self.local_filepath))
