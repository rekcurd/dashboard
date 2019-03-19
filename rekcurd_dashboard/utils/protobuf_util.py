from werkzeug.datastructures import FileStorage


class ProtobufUtil:
    @staticmethod
    def stream_file(f:FileStorage, size:int=4190000) -> bytes:
        for byte in iter(lambda: f.read(size), b''):
            yield byte
