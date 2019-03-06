import unittest

from rekcurd_dashboard.apis.common import *


class CommonTest(unittest.TestCase):
    def test_kubernetes_cpu_to_float(self):
        self.assertEqual(1.0, kubernetes_cpu_to_float('1.0'))
        self.assertEqual(1000000.0, kubernetes_cpu_to_float('1M'))
        with self.assertRaises(ValueError):
            kubernetes_cpu_to_float('hoge')
