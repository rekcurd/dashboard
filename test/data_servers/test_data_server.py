import unittest

from rekcurd_dashboard.models import DataServerModel, DataServerModeEnum, ApplicationModel
from rekcurd_dashboard.data_servers import DataServer

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
    def test_upload_model_local(self):
        self.assertIsNotNone(self.data_server.upload_model(
            self.data_server_model_local, self.application_model, self.local_filepath))

    @patch_predictor()
    def test_upload_model_ceph(self):
        self.assertIsNotNone(self.data_server.upload_model(
            self.data_server_model_ceph, self.application_model, self.local_filepath))

    @patch_predictor()
    def test_upload_model_aws(self):
        self.assertIsNotNone(self.data_server.upload_model(
            self.data_server_model_aws, self.application_model, self.local_filepath))
