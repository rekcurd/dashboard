import time
import unittest

import grpc
from grpc.framework.foundation import logging_pool
import grpc_testing

from rekcurd_dashboard.protobuf import rekcurd_pb2
from test.core import _client_application

target_service = rekcurd_pb2.DESCRIPTOR.services_by_name['RekcurdDashboard']


class RekcurdDashboardClientTest(unittest.TestCase):

    def setUp(self):
        self._client_execution_thread_pool = logging_pool.pool(1)
        self._fake_time = grpc_testing.strict_fake_time(time.time())
        self._real_time = grpc_testing.strict_real_time()
        self._fake_time_channel = grpc_testing.channel(
            rekcurd_pb2.DESCRIPTOR.services_by_name.values(), self._fake_time)
        self._real_time_channel = grpc_testing.channel(
            rekcurd_pb2.DESCRIPTOR.services_by_name.values(), self._real_time)

    def tearDown(self):
        self._client_execution_thread_pool.shutdown(wait=True)

    def test_metadata(self):
        application_future = self._client_execution_thread_pool.submit(
            _client_application.run, _client_application.Scenario.SERVICE_INFO,
            self._real_time_channel)
        invocation_metadata, request, rpc = (
            self._real_time_channel.take_unary_unary(
                target_service.methods_by_name['ServiceInfo']))
        rpc.send_initial_metadata(())
        rpc.terminate(_client_application.Response.SERVICE_INFO_RESPONSE.value, (),
                      grpc.StatusCode.OK, '')
        application_return_value = application_future.result()

        self.assertEqual(invocation_metadata[0], ('x-rekcurd-application-name', 'rekcurd-sample'))
        self.assertEqual(invocation_metadata[1], ('x-rekcurd-sevice-level', 'development'))

    def test_service_info(self):
        application_future = self._client_execution_thread_pool.submit(
            _client_application.run, _client_application.Scenario.SERVICE_INFO,
            self._real_time_channel)
        invocation_metadata, request, rpc = (
            self._real_time_channel.take_unary_unary(
                target_service.methods_by_name['ServiceInfo']))
        rpc.send_initial_metadata(())
        rpc.terminate(_client_application.Response.SERVICE_INFO_RESPONSE.value, (),
                      grpc.StatusCode.OK, '')
        application_return_value = application_future.result()

        self.assertIs(application_return_value.kind,
                      _client_application.Outcome.Kind.SATISFACTORY)

    def test_upload_model(self):
        application_future = self._client_execution_thread_pool.submit(
            _client_application.run, _client_application.Scenario.UPLOAD_MODEL,
            self._real_time_channel)
        invocation_metadata, rpc = self._real_time_channel.take_stream_unary(
            target_service.methods_by_name['UploadModel'])
        rpc.send_initial_metadata(())
        first_request = rpc.take_request()
        second_request = rpc.take_request()
        third_request = rpc.take_request()
        rpc.requests_closed()
        rpc.terminate(_client_application.Response.MODEL_RESPONSE.value, (),
                      grpc.StatusCode.OK, '')
        application_return_value = application_future.result()

        self.assertEqual(_client_application.Request.UPLOAD_MODEL_REQUEST.value, first_request)
        self.assertEqual(_client_application.Request.UPLOAD_MODEL_REQUEST.value, second_request)
        self.assertEqual(_client_application.Request.UPLOAD_MODEL_REQUEST.value, third_request)
        self.assertIs(application_return_value.kind,
                      _client_application.Outcome.Kind.SATISFACTORY)

    def test_switch_model(self):
        application_future = self._client_execution_thread_pool.submit(
            _client_application.run, _client_application.Scenario.SWITCH_MODEL,
            self._real_time_channel)
        invocation_metadata, request, rpc = (
            self._real_time_channel.take_unary_unary(
                target_service.methods_by_name['SwitchModel']))
        rpc.send_initial_metadata(())
        rpc.terminate(_client_application.Response.MODEL_RESPONSE.value, (),
                      grpc.StatusCode.OK, '')
        application_return_value = application_future.result()

        self.assertIs(application_return_value.kind,
                      _client_application.Outcome.Kind.SATISFACTORY)

    def test_upload_evaluation_data(self):
        application_future = self._client_execution_thread_pool.submit(
            _client_application.run, _client_application.Scenario.UPLOAD_EVALUATION_DATA,
            self._real_time_channel)
        invocation_metadata, rpc = self._real_time_channel.take_stream_unary(
            target_service.methods_by_name['UploadEvaluationData'])
        rpc.send_initial_metadata(())
        first_request = rpc.take_request()
        second_request = rpc.take_request()
        third_request = rpc.take_request()
        rpc.requests_closed()
        rpc.terminate(_client_application.Response.UPLOAD_EVALUATION_DATA_RESPONSE.value, (),
                      grpc.StatusCode.OK, '')
        application_return_value = application_future.result()

        self.assertEqual(_client_application.Request.UPLOAD_EVALUATION_DATA_REQUEST.value, first_request)
        self.assertEqual(_client_application.Request.UPLOAD_EVALUATION_DATA_REQUEST.value, second_request)
        self.assertEqual(_client_application.Request.UPLOAD_EVALUATION_DATA_REQUEST.value, third_request)
        self.assertIs(application_return_value.kind,
                      _client_application.Outcome.Kind.SATISFACTORY)

    def test_evaluate_model(self):
        application_future = self._client_execution_thread_pool.submit(
            _client_application.run, _client_application.Scenario.EVALUATE_MODEL,
            self._real_time_channel)
        invocation_metadata, rpc = self._real_time_channel.take_stream_unary(
            target_service.methods_by_name['EvaluateModel'])
        rpc.send_initial_metadata(())
        first_request = rpc.take_request()
        second_request = rpc.take_request()
        third_request = rpc.take_request()
        rpc.requests_closed()
        rpc.terminate(_client_application.Response.EVALUATE_MODEL_RESPONSE.value, (),
                      grpc.StatusCode.OK, '')
        application_return_value = application_future.result()

        self.assertEqual(_client_application.Request.EVALUATE_MODEL_REQUEST.value, first_request)
        self.assertEqual(_client_application.Request.EVALUATE_MODEL_REQUEST.value, second_request)
        self.assertEqual(_client_application.Request.EVALUATE_MODEL_REQUEST.value, third_request)
        self.assertIs(application_return_value.kind,
                      _client_application.Outcome.Kind.SATISFACTORY)

    def test_evaluation_data(self):
        application_future = self._client_execution_thread_pool.submit(
            _client_application.run, _client_application.Scenario.EVALUATION_RESULT,
            self._fake_time_channel)
        invocation_metadata, request, rpc = (
            self._fake_time_channel.take_unary_stream(
                target_service.methods_by_name['EvaluationResult']))
        rpc.send_initial_metadata(())
        rpc.terminate((), grpc.StatusCode.OK, '')
        application_return_value = application_future.result()

        self.assertEqual(_client_application.Request.EVALUATION_RESULT_REQUEST.value[0], request.data_path)
        self.assertEqual(_client_application.Request.EVALUATION_RESULT_REQUEST.value[1], request.result_path)
        self.assertIs(application_return_value.kind,
                      _client_application.Outcome.Kind.SATISFACTORY)
