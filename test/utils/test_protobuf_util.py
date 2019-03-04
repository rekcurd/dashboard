import unittest

from werkzeug.datastructures import FileStorage

from rekcurd_dashboard.utils import ProtobufUtil


class ProtobufUtilTest(unittest.TestCase):
    """Tests for ProtobufUtil.
    """

    def test_stream_file(self):
        with open('test/utils/dummy', 'rb') as fp:
            file = FileStorage(fp)
            for rtn in ProtobufUtil.stream_file(file, size=4):
                self.assertEqual(rtn, b'dumm')
                break
