import logging

from kubernetes import client as k8s_client
from kubernetes import config as k8s_config
from kubernetes.client.rest import ApiException

import numpy as np

from werkzeug.datastructures import FileStorage

from rekcurd_dashboard.core import RekcurdDashboardClient
from rekcurd_client import RekcurdWorkerClient
from rekcurd_dashboard.logger import JsonSystemLogger
from rekcurd_dashboard.apis.kubernetes_handler import get_full_config_path
from rekcurd_dashboard.models import ServiceModel

from e2e_test.base import (
    BaseTestCase, WorkerConfiguration, create_kubernetes_model,
    create_application_model, create_service_model, create_model_model,
    NEGATIVE_MODEL_PATH, POSITIVE_MODEL_PATH, TEST_MODEL_ID1, TEST_MODEL_ID2,
    TEST_PROJECT_ID, TEST_APPLICATION_ID, TEST_SERVICE_ID
)


class TestApiSingleServiceRegistration(BaseTestCase):
    __URL = f'/api/projects/{TEST_PROJECT_ID}/applications/{TEST_APPLICATION_ID}/single_service_registration'

    def test_post(self):
        application_model = create_application_model()
        service_model = create_service_model()
        host = service_model.host
        port = service_model.port
        application_name = application_model.application_name
        service_level = service_model.service_level
        rekcurd_grpc_version = service_model.version
        core_v1 = k8s_client.CoreV1Api()
        core_v1.read_namespaced_service(
            name=WorkerConfiguration.service['metadata']['name'],
            namespace=service_level)
        self.wait_worker_ready(
            host=host, port=port, application_name=application_name,
            service_level=service_level, rekcurd_grpc_version=rekcurd_grpc_version)

        display_name = "test-service"
        description = ""
        service_level = "development"
        version = service_model.version
        service_model_assignment = 1
        service_host = service_model.host
        service_port = service_model.port
        ServiceModel.query.filter(ServiceModel.service_id == TEST_SERVICE_ID).delete()
        response = self.client.post(
            self.__URL,
            data={'display_name': display_name, 'description': description,
                  'service_level': service_level, 'version': version,
                  'service_model_assignment': service_model_assignment,
                  'service_host': service_host, 'service_port': service_port})
        self.assertEqual(200, response.status_code)


class TestApiServiceDeployment(BaseTestCase):
    __URL = f'/api/projects/{TEST_PROJECT_ID}/applications/{TEST_APPLICATION_ID}/service_deployment'

    def test_post(self):
        container = WorkerConfiguration.deployment['spec']['template']['spec']['containers'][0]
        service_level = WorkerConfiguration.deployment['metadata']['namespace']
        container_image = container['image']
        service_model_assignment = 1
        resource_request_cpu = container['resources']['requests']['cpu']
        resource_request_memory = container['resources']['requests']['memory']
        response = self.client.post(
            self.__URL,
            data={'service_level': service_level, 'container_image': container_image,
                  'service_model_assignment': service_model_assignment,
                  'resource_request_cpu': resource_request_cpu, 'resource_request_memory': resource_request_memory})
        self.assertEqual(200, response.status_code)
        service_model = ServiceModel.query.filter(ServiceModel.service_id != TEST_SERVICE_ID).one_or_none()
        self.assertIsNotNone(service_model)

        application_model = create_application_model()
        service_model = create_service_model()
        host = service_model.host
        port = service_model.port
        application_name = application_model.application_name
        service_level = service_model.service_level
        rekcurd_grpc_version = service_model.version
        self.wait_worker_ready(
            host=host, port=port, application_name=application_name,
            service_level=service_level, rekcurd_grpc_version=rekcurd_grpc_version)


class TestApiServiceIdDeployment(BaseTestCase):
    __URL = f'/api/projects/{TEST_PROJECT_ID}/applications/{TEST_APPLICATION_ID}/service_deployment/{TEST_SERVICE_ID}'

    def test_get(self):
        response = self.client.get(self.__URL)
        self.assertEqual(200, response.status_code)

    def test_put(self):
        response = self.client.put(self.__URL)
        self.assertEqual(200, response.status_code)

    def test_patch(self):
        deployment_info = self.client.get(self.__URL)
        response = self.client.patch(
            self.__URL,
            data=deployment_info.json)
        self.assertEqual(200, response.status_code)
