import unittest

from rekcurd_dashboard.models import DataServerModel, DataServerModeEnum
from rekcurd_dashboard.data_servers import CephHandler

from . import patch_predictor


class CephHandlerTest(unittest.TestCase):
    """Tests for CephHandlerTest.
    """

    def setUp(self):
        self.data_server_model = DataServerModel(
            project_id=1, data_server_mode=DataServerModeEnum.CEPH_S3,
            ceph_host="127.0.0.1", ceph_port=443, ceph_access_key="xxx",
            ceph_secret_key="xxx", ceph_is_secure=True, ceph_bucket_name="xxx")
        self.handler = CephHandler()

    @patch_predictor()
    def test_download(self):
        self.assertIsNone(self.handler.download(self.data_server_model, "remote", "local"))

    @patch_predictor()
    def test_upload(self):
        self.assertIsNone(self.handler.upload(self.data_server_model, "remote", "local"))
