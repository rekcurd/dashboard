from werkzeug.datastructures import FileStorage

class ProtobufUtil:

    @staticmethod
    def serialize_to_object(proto, descriptor = None):
        if isinstance(proto, (str, int, bool)):
            return proto
        ## TODO Use protobuf label = 3
        elif descriptor and descriptor.label == 3:
            result = []
            for item in proto:
                result.append(ProtobufUtil.serialize_to_object(item))
            return result
        else:
            result = dict()
            for item in proto.ListFields():
                result[item[0].name] = ProtobufUtil.serialize_to_object(item[1], item[0])
            return result

    @staticmethod
    def stream_file(f:FileStorage, size:int=4190000) -> bytes:
        for byte in iter(lambda: f.read(size), b''):
            yield byte