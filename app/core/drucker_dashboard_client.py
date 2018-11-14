#!/usr/bin/python
# -*- coding: utf-8 -*-
#
# DO NOT EDIT HERE!!

import traceback, types
import grpc

import drucker_pb2
import drucker_pb2_grpc

from logger.logger_interface import SystemLoggerInterface
from utils.protobuf_util import ProtobufUtil
from werkzeug.datastructures import FileStorage


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


class DruckerDashboardClient:
    def __init__(self, logger:SystemLoggerInterface, host:str=None, domain:str=None, app:str=None, env:str=None, version:int=None):
        self.logger = logger
        self.stub = None
        if host is None and (domain is None or app is None or env is None):
            raise RuntimeError("You must specify host or domain+app+env.")

        if version is None:
            v_str = drucker_pb2.DESCRIPTOR.GetOptions().Extensions[drucker_pb2.drucker_grpc_proto_version]
        else:
            v_str = drucker_pb2.EnumVersionInfo.Name(version)

        if host is None:
            self.__change_domain_app_env(domain, app, env, v_str)
        else:
            self.__change_host(host)

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

    def __change_domain_app_env(self, domain:str, app:str, env:str, version:str):
        host = "{0}-{1}-{2}.{3}".format(app,version,env,domain)
        self.__change_host(host)

    def __change_host(self, host:str):
        channel = grpc.insecure_channel(host)
        self.stub = drucker_pb2_grpc.DruckerDashboardStub(channel)

    @error_handling({"status": False})
    def run_service_info(self):
        request = drucker_pb2.ServiceInfoRequest()
        response_protobuf = self.stub.ServiceInfo(request)
        response = ProtobufUtil.serialize_to_object(response_protobuf)
        return response

    def __upload_model_request(self, model_path:str, f:FileStorage):
        for data in ProtobufUtil.stream_file(f):
            request = drucker_pb2.UploadModelRequest(
                path=model_path,
                data=data
            )
            yield request

    @error_handling({"status": False})
    def run_upload_model(self, model_path:str, f:FileStorage):
        request_iterator = self.__upload_model_request(model_path, f)
        response = self.stub.UploadModel(request_iterator)
        response = ProtobufUtil.serialize_to_object(response)
        if not response["status"]:
            raise Exception(response["message"])
        return response

    @error_handling({"status": False})
    def run_switch_service_model_assignment(self, model_path:str):
        request = drucker_pb2.SwitchModelRequest(
            path=model_path,
        )
        response_protobuf = self.stub.SwitchModel(request)
        response = ProtobufUtil.serialize_to_object(response_protobuf)
        if not response["status"]:
            raise Exception(response["message"])
        return response

    def __eval_model_request(self, f:FileStorage, data_path:str):
        for data in ProtobufUtil.stream_file(f):
            request = drucker_pb2.EvaluateModelRequest(data=data, data_path=data_path)
            yield request

    def run_evaluate_model(self, f:FileStorage, data_path:str):
        try:
            request_iterator = self.__eval_model_request(f, data_path)
            response = self.stub.EvaluateModel(request_iterator)
            response = ProtobufUtil.serialize_to_object(response)
            return response
        except Exception as e:
            self.logger.error(str(e))
            self.logger.error(traceback.format_exc())
            response = drucker_pb2.EvaluateModelResponse()
            response = ProtobufUtil.serialize_to_object(response)
            return response
