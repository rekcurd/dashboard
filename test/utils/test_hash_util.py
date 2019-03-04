import unittest

from werkzeug.datastructures import FileStorage

from rekcurd_dashboard.utils import HashUtil


class HashUtilTest(unittest.TestCase):
    """Tests for HashUtil.
    """

    def test_checksum_str(self):
        self.assertEqual(HashUtil.checksum('test/utils/dummy'), '275876e34cf609db118f3d84b799a790')

    def test_checksum_bytes(self):
        self.assertEqual(HashUtil.checksum(b'dummy'), '275876e34cf609db118f3d84b799a790')

    def test_checksum_filestorage(self):
        with open('test/utils/dummy', 'rb') as fp:
            file = FileStorage(fp)
            self.assertEqual(HashUtil.checksum(file), '275876e34cf609db118f3d84b799a790')
