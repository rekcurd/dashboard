import unittest

from rekcurd_dashboard.logger import FluentSystemLogger


class FluentSystemLoggerTest(unittest.TestCase):
    """Tests for FluentSystemLogger.
    """

    def setUp(self):
        self.logger = FluentSystemLogger()

    def test_exception(self):
        self.assertIsNone(self.logger.exception("Exception"))

    def test_error(self):
        self.assertIsNone(self.logger.error("Error"))

    def test_debug(self):
        self.assertIsNone(self.logger.debug("Debug"))

    def test_info(self):
        self.assertIsNone(self.logger.info("Info"))

    def test_warn(self):
        self.assertIsNone(self.logger.warn("Warn"))
