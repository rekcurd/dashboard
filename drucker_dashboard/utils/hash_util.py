from typing import Union
import hashlib

from werkzeug.datastructures import FileStorage


class HashUtil:
    @staticmethod
    def checksum(f: Union[str, bytes, FileStorage]) -> str:
        chunk_size = 4096
        if isinstance(f, bytes):
            hash_md5 = hashlib.md5(f)
        elif isinstance(f, str):
            hash_md5 = hashlib.md5()
            with open(f, "rb") as infile:
                for chunk in iter(lambda: infile.read(chunk_size), b""):
                    hash_md5.update(chunk)
        else:
            hash_md5 = hashlib.md5()
            for chunk in iter(lambda: f.read(chunk_size), b''):
                hash_md5.update(chunk)
            f.seek(0)

        return hash_md5.hexdigest()
