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

from e2e_test.base import (
    BaseTestCase, WorkerConfiguration, create_kubernetes_model,
    create_application_model, create_service_model, create_model_model,
    NEGATIVE_MODEL_PATH, POSITIVE_MODEL_PATH, TEST_MODEL_ID1, TEST_MODEL_ID2,
    TEST_PROJECT_ID, TEST_APPLICATION_ID, TEST_SERVICE_ID
)


class TestApiServiceId(BaseTestCase):
    __URL = f'/api/projects/{TEST_PROJECT_ID}/applications/{TEST_APPLICATION_ID}/services/{TEST_SERVICE_ID}'

    def test_put(self):
        application_model = create_application_model()
        service_model = create_service_model()
        insecure_host = service_model.insecure_host
        insecure_port = service_model.insecure_port
        application_name = application_model.application_name
        service_level = service_model.service_level
        rekcurd_grpc_version = service_model.version
        positive_model = create_model_model(model_id=TEST_MODEL_ID1, positive_model=True)
        negative_model = create_model_model(model_id=TEST_MODEL_ID2, positive_model=False)
        core_v1 = k8s_client.CoreV1Api()
        core_v1.read_namespaced_service(
            name=WorkerConfiguration.service['metadata']['name'],
            namespace=service_level)
        self.wait_worker_ready(
            insecure_host=insecure_host, insecure_port=insecure_port, application_name=application_name,
            service_level=service_level, rekcurd_grpc_version=rekcurd_grpc_version)

        # Upload models
        logger = JsonSystemLogger('Rekcurd dashboard test', log_level=logging.CRITICAL)
        dashboard_client = RekcurdDashboardClient(
            host=insecure_host, port=insecure_port, application_name=application_name,
            service_level=service_level, rekcurd_grpc_version=rekcurd_grpc_version)
        dashboard_client.logger = logger
        dashboard_client.run_upload_model(model_path=positive_model.filepath,
                                          f=FileStorage(open(POSITIVE_MODEL_PATH, 'rb')))
        dashboard_client.run_upload_model(model_path=negative_model.filepath,
                                          f=FileStorage(open(NEGATIVE_MODEL_PATH, 'rb')))

        worker_client = RekcurdWorkerClient(
            host=insecure_host, port=insecure_port, application_name=application_name,
            service_level=service_level, rekcurd_grpc_version=rekcurd_grpc_version)
        # Switch to the negative model
        response = self.client.put(self.__URL, data={'model_id': TEST_MODEL_ID2})
        self.assertEqual(200, response.status_code)
        for _ in range(100):
            y_negative = worker_client.run_predict_arrfloat_string(
                np.random.rand(np.random.randint(1, 100)).tolist()).output
            self.assertEqual(y_negative, '0', 'Negative model should always 0.')

        # Switch to the positive model
        response = self.client.put(self.__URL, data={'model_id': TEST_MODEL_ID1})
        self.assertEqual(200, response.status_code)
        for _ in range(100):
            y_positive = worker_client.run_predict_arrfloat_string(
                np.random.rand(np.random.randint(1, 100)).tolist()).output
            self.assertEqual(y_positive, '1', 'Positive model should always 1.')

    def test_delete(self):
        kubernetes_model = create_kubernetes_model()
        application_model = create_application_model()
        service_model = create_service_model()
        namespace = service_model.service_level

        # Confirm each components exist -> no exception raises
        k8s_config.load_kube_config(get_full_config_path(kubernetes_model.config_path))
        apps_v1_api = k8s_client.AppsV1Api()
        core_v1 = k8s_client.CoreV1Api()
        autoscaling_v1_api = k8s_client.AutoscalingV1Api()
        custom_object_api = k8s_client.CustomObjectsApi()
        core_v1.read_namespaced_service(
            name=WorkerConfiguration.service['metadata']['name'],
            namespace=namespace)
        self.wait_worker_ready(insecure_host=service_model.insecure_host,
                               insecure_port=service_model.insecure_port,
                               application_name=application_model.application_name,
                               service_level=service_model.service_level,
                               rekcurd_grpc_version=service_model.version)

        try:
            apps_v1_api.read_namespaced_deployment(
                name=WorkerConfiguration.deployment['metadata']['name'],
                namespace=namespace)
            core_v1.read_namespaced_service(
                name=WorkerConfiguration.service['metadata']['name'],
                namespace=namespace)
            autoscaling_v1_api.read_namespaced_horizontal_pod_autoscaler(
                name=WorkerConfiguration.autoscaling['metadata']['name'],
                namespace=namespace)
            custom_object_api.get_namespaced_custom_object(
                group="networking.istio.io", version="v1alpha3", namespace=namespace,
                plural="virtualservices", name=WorkerConfiguration.virtualservice['metadata']['name'])
        except ApiException:
            self.fail('Some components of worker are not running.')

        self.client.delete(self.__URL)
        # Make sure every thing deleted
        # Reading deleted deployment will raise ApiException
        self.assertRaises(ApiException,
                          apps_v1_api.read_namespaced_deployment,
                          name=WorkerConfiguration.deployment['metadata']['name'],
                          namespace=namespace)
        self.assertRaises(ApiException,
                          core_v1.read_namespaced_service,
                          name=WorkerConfiguration.service['metadata']['name'],
                          namespace=namespace)
        self.assertRaises(ApiException,
                          autoscaling_v1_api.read_namespaced_horizontal_pod_autoscaler,
                          name=WorkerConfiguration.autoscaling['metadata']['name'],
                          namespace=namespace)
        self.assertRaises(ApiException,
                          custom_object_api.get_namespaced_custom_object,
                          group="networking.istio.io", version="v1alpha3", namespace=namespace,
                          plural="virtualservices", name=WorkerConfiguration.virtualservice['metadata']['name'])
