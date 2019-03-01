import unittest

from rekcurd_dashboard.models import DataServerModel, DataServerModeEnum
from rekcurd_dashboard.data_servers import AwsS3Handler

from . import patch_predictor


class AwsS3HandlerTest(unittest.TestCase):
    """Tests for AwsS3HandlerTest.
    """

    def setUp(self):
        self.data_server_model = DataServerModel(
            project_id=1, data_server_mode=DataServerModeEnum.AWS_S3,
            aws_access_key="xxx", aws_secret_key="xxx", aws_bucket_name="xxx")
        self.handler = AwsS3Handler()

    @patch_predictor()
    def test_download(self):
        self.assertIsNone(self.handler.download(self.data_server_model, "remote", "local"))

    @patch_predictor()
    def test_upload(self):
        self.assertIsNone(self.handler.upload(self.data_server_model, "remote", "local"))
