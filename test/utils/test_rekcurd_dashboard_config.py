import os
import unittest

from rekcurd_dashboard.utils import RekcurdDashboardConfig


class RekcurdDashboardConfigTest(unittest.TestCase):
    """Tests for RekcurdDashboardConfig.
    """

    def test_load_from_file(self):
        config = RekcurdDashboardConfig("./test/test-settings.yml")
        self.assertEqual(config.DEBUG_MODE, True)
        self.assertEqual(config.SQLALCHEMY_DATABASE_URI, "sqlite:///db.test.sqlite3")

    def test_load_from_env(self):
        os.environ["DASHBOARD_KUBERNETES_MODE"] = "True"
        os.environ["DASHBOARD_DEBUG_MODE"] = "False"
        os.environ["DASHBOARD_DB_MODE"] = "sqlite"
        os.environ["DASHBOARD_IS_AUTH"] = "True"
        os.environ["DASHBOARD_LDAP_SEARCH_BASE_DNS"] = '["OU=user, DC=example, DC=com"]'
        config = RekcurdDashboardConfig("./test/test-settings.yml")
        self.assertEqual(config.DEBUG_MODE, False)
        self.assertEqual(config.SQLALCHEMY_DATABASE_URI, "sqlite:///db.test.sqlite3")
        del os.environ["DASHBOARD_KUBERNETES_MODE"]
        del os.environ["DASHBOARD_DEBUG_MODE"]
        del os.environ["DASHBOARD_DB_MODE"]
        del os.environ["DASHBOARD_IS_AUTH"]
        del os.environ["DASHBOARD_LDAP_SEARCH_BASE_DNS"]

    def test_set_configurations(self):
        config = RekcurdDashboardConfig("./test/test-settings.yml")
        config.set_configurations(
            debug_mode=False, db_mode="mysql", db_host="localhost",
            db_port=1234, db_name="test", db_username="test", db_password="test")
        self.assertEqual(config.DEBUG_MODE, False)
        self.assertEqual(config.SQLALCHEMY_DATABASE_URI, "sqlite:///db.test.sqlite3")
