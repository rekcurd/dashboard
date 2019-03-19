#!/usr/bin/python
# -*- coding: utf-8 -*-
#
# DO NOT EDIT HERE!!

import traceback, types
import grpc

from rekcurd_dashboard.protobuf import rekcurd_pb2, rekcurd_pb2_grpc

from rekcurd_dashboard.logger import SystemLoggerInterface, JsonSystemLogger
from rekcurd_dashboard.utils import ProtobufUtil
from werkzeug.datastructures import FileStorage
from protobuf_to_dict import protobuf_to_dict


def error_handling(error_response):
    """ Decorator for handling error

    Apply following processing on Servicer methods
    to handle errors.

    - Call :func:``on_error`` method (if defined) in the class
      to postprocess something on error

    Parameters
    ----------
    error_response
    """
    def _wrapper_maker(func):
        def _wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except Exception as error:
                servicer = args[0]
                if hasattr(servicer, 'on_error'):
                    assert isinstance(servicer.on_error, types.MethodType), \
                        'You must define on_error as method'
                    servicer.on_error(error)
                return error_response
        return _wrapper
    return _wrapper_maker


class RekcurdDashboardClient:
    _logger: SystemLoggerInterface = None

    def __init__(self, host: str = None, port: int = None,
                 application_name: str = None, service_level: str = None,
                 rekcurd_grpc_version: str = None):
        self.logger = JsonSystemLogger()

        _host = "127.0.0.1"
        _port = 5000
        host = host or _host
        port = int(port or _port)

        if rekcurd_grpc_version is None:
            rekcurd_grpc_version = rekcurd_pb2.DESCRIPTOR.GetOptions().Extensions[rekcurd_pb2.rekcurd_grpc_proto_version]
        else:
            rekcurd_pb2.EnumVersionInfo.Value(rekcurd_grpc_version)

        self.__metadata = [('x-rekcurd-application-name', application_name),
                           ('x-rekcurd-sevice-level', service_level),
                           ('x-rekcurd-grpc-version', rekcurd_grpc_version)]

        channel = grpc.insecure_channel("{}:{}".format(host, port))
        self.stub = rekcurd_pb2_grpc.RekcurdDashboardStub(channel)

    @property
    def logger(self):
        return self._logger

    @logger.setter
    def logger(self, logger: SystemLoggerInterface):
        if isinstance(logger, SystemLoggerInterface):
            self._logger = logger
        else:
            raise TypeError("Invalid logger type.")

    def on_error(self, error: Exception):
        """ Postprocessing on error

        For detail, see :func:``on_error``

        Parameters
        ----------
        error : Exception
            Error to be handled
        """
        self.logger.error(str(error))
        self.logger.error(traceback.format_exc())

    @error_handling({"status": False})
    def run_service_info(self):
        request = rekcurd_pb2.ServiceInfoRequest()
        response_protobuf = self.stub.ServiceInfo(request, metadata=self.__metadata)
        response = protobuf_to_dict(response_protobuf,
                                    including_default_value_fields=True)
        return response

    def __upload_model_request(self, model_path:str, f:FileStorage):
        for data in ProtobufUtil.stream_file(f):
            request = rekcurd_pb2.UploadModelRequest(
                path=model_path,
                data=data
            )
            yield request

    @error_handling({"status": False})
    def run_upload_model(self, model_path:str, f:FileStorage):
        request_iterator = self.__upload_model_request(model_path, f)
        response = self.stub.UploadModel(request_iterator, metadata=self.__metadata)
        response = protobuf_to_dict(response,
                                    including_default_value_fields=True)
        if not response["status"]:
            raise Exception(response["message"])
        return response

    @error_handling({"status": False})
    def run_switch_service_model_assignment(self, model_path:str):
        request = rekcurd_pb2.SwitchModelRequest(
            path=model_path,
        )
        response_protobuf = self.stub.SwitchModel(request, metadata=self.__metadata)
        response = protobuf_to_dict(response_protobuf,
                                    including_default_value_fields=True)
        if not response["status"]:
            raise Exception(response["message"])
        return response

    @error_handling({"status": False})
    def run_evaluate_model(self, data_path:str, result_path:str):
        request_iterator = iter([rekcurd_pb2.EvaluateModelRequest(data_path=data_path, result_path=result_path)])
        metrics = self.stub.EvaluateModel(request_iterator, metadata=self.__metadata).metrics
        response = dict(protobuf_to_dict(metrics, including_default_value_fields=True),
                        label=[self.__get_value_from_io(l) for l in metrics.label])
        response['status'] = True
        return response

    def __upload_eval_data_request(self, f:FileStorage, data_path:str):
        for data in ProtobufUtil.stream_file(f):
            request = rekcurd_pb2.UploadEvaluationDataRequest(data=data, data_path=data_path)
            yield request

    @error_handling({"status": False})
    def run_upload_evaluation_data(self, f:FileStorage, data_path:str):
        request_iterator = self.__upload_eval_data_request(f, data_path)
        response = protobuf_to_dict(self.stub.UploadEvaluationData(request_iterator, metadata=self.__metadata),
                                    including_default_value_fields=True)
        return response

    def __get_value_from_io(self, io:rekcurd_pb2.IO):
        if io.WhichOneof('io_oneof') == 'str':
            val = io.str.val
        else:
            val = io.tensor.val

        if len(val) == 1:
            return val[0]
        else:
            return list(val)

    @error_handling({"status": False})
    def run_evaluation_data(self, data_path:str, result_path:str):
        request = rekcurd_pb2.EvaluationResultRequest(data_path=data_path, result_path=result_path)
        for raw_response in self.stub.EvaluationResult(request, metadata=self.__metadata):
            details = []
            for detail in raw_response.detail:
                details.append(dict(
                    protobuf_to_dict(detail, including_default_value_fields=True),
                    input=self.__get_value_from_io(detail.input),
                    label=self.__get_value_from_io(detail.label),
                    output=self.__get_value_from_io(detail.output),
                    score=detail.score[0] if len(detail.score) == 1 else list(detail.score)
                ))
            metrics = raw_response.metrics
            metrics_response = dict(protobuf_to_dict(metrics, including_default_value_fields=True),
                                    label=[self.__get_value_from_io(l) for l in metrics.label])
            response = protobuf_to_dict(raw_response,
                                        including_default_value_fields=True)
            response['detail'] = details
            response['status'] = True
            response['metrics'] = metrics_response
            yield response
