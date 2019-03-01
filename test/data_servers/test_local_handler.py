import unittest

from rekcurd_dashboard.models import DataServerModel, DataServerModeEnum
from rekcurd_dashboard.data_servers import LocalHandler

from . import patch_predictor


class LocalHandlerTest(unittest.TestCase):
    """Tests for LocalHandler.
    """

    def setUp(self):
        self.data_server_model = DataServerModel(
            project_id=1, data_server_mode=DataServerModeEnum.LOCAL)
        self.handler = LocalHandler()

    @patch_predictor()
    def test_download(self):
        self.assertIsNone(self.handler.download(self.data_server_model, "remote", "local"))

    @patch_predictor()
    def test_upload(self):
        self.assertIsNone(self.handler.upload(self.data_server_model, "remote", "local"))
