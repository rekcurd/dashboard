from .base import BaseTestCase
from drucker_dashboard.server import create_app


class CustomLoggerTest(BaseTestCase):
    """Tests for CustomLogger.
    """

    def create_app(self):
        return create_app("test/test-auth-settings.yml", "test/dummy_logger.py")

    def test_logger(self):
        from drucker_dashboard.apis import api
        from test.dummy_logger import DummySystemLogger
        self.assertTrue(type(api.logger).__name__ == DummySystemLogger.__name__)


class CustomLoggerTest2(BaseTestCase):
    """Tests for CustomLogger.
    """

    def create_app(self):
        return create_app("test/test-auth-settings.yml", "drucker_dashboard/test/dummy_invalid_logger.py")

    def test_logger(self):
        from drucker_dashboard.apis import api
        from drucker_dashboard.logger import logger
        self.assertTrue(type(api.logger).__name__ == type(logger).__name__)
