from .base import BaseTestCase
from drucker_dashboard.server import create_app


class CustomLoggerTest(BaseTestCase):
    """Tests for CustomLogger.
    """

    def create_app(self):
        return create_app("drucker_dashboard/test/test-auth-settings.yml", "drucker_dashboard/test/dummy_logger.py")

    def test_logger(self):
        # TBD
        self.assertTrue(True)
