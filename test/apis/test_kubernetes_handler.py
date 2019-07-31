from functools import wraps
from unittest.mock import patch, Mock, mock_open

from werkzeug.datastructures import FileStorage

from rekcurd_dashboard.apis.kubernetes_handler import (
    get_full_config_path, save_kubernetes_access_file, remove_kubernetes_access_file
)

from test.base import BaseTestCase


def mock_decorator():
    """Decorator to mock for dashboard.
    """

    def test_method(func):
        @wraps(func)
        def inner_method(*args, **kwargs):
            with patch('builtins.open', new_callable=mock_open) as _, \
                    patch('rekcurd_dashboard.apis.kubernetes_handler.Path.unlink',
                          new=Mock(return_value=None)) as _:
                return func(*args, **kwargs)
        return inner_method
    return test_method


class ApiSettingsTest(BaseTestCase):
    def setUp(self):
        pass

    def test_get_full_config_path(self):
        self.assertTrue(get_full_config_path('tmp').endswith('kube-config/tmp'))

    def test_save_kubernetes_access_file(self):
        with open('test/dummy', 'rb') as fp:
            file = FileStorage(fp)
            self.assertIsNone(save_kubernetes_access_file(file, 'tmp'))

    @mock_decorator()
    def test_remove_kubernetes_access_file(self):
        self.assertIsNone(remove_kubernetes_access_file('tmp'))
