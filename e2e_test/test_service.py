import logging

from kubernetes import client as k8s_client
from kubernetes import config as k8s_config
from kubernetes.client.rest import ApiException

import numpy as np

from werkzeug.datastructures import FileStorage

from drucker_dashboard.drucker_dashboard_client import DruckerDashboardClient
from drucker_client import DruckerWorkerClient
from drucker_dashboard.models import db, Service
from drucker_dashboard.logger import JsonSystemLogger
from drucker_dashboard.apis.api_kubernetes import get_full_config_path

from e2e_test.base import BaseTestCase
from e2e_test.base import WorkerConfiguration
from e2e_test.base import kube_setting1
from e2e_test.base import create_kube_obj, create_app_obj, create_service_obj, create_model_obj
from e2e_test.base import NEGATIVE_MODEL_PATH, POSITIVE_MODEL_PATH


class TestApiApplicationIdServices(BaseTestCase):

    def test_get(self):
        kobj = create_kube_obj()
        aobj = create_app_obj(kobj.kubernetes_id)
        sobj = create_service_obj(aobj.application_id)
        response = self.client.get(f'/api/applications/{aobj.application_id}/services')
        self.assertEqual(200, response.status_code)
        self.assertIsNotNone(response)


class TestApiApplicationIdServiceId(BaseTestCase):

    def test_get(self):
        kobj = create_kube_obj()
        aobj = create_app_obj(kobj.kubernetes_id)
        sobj = create_service_obj(aobj.application_id)
        response = self.client.get(f'/api/applications/{aobj.application_id}/services/{sobj.service_id}')
        self.assertEqual(response.json['service_id'], sobj.service_id)
        self.assertEqual(response.json['display_name'], sobj.display_name)

    def test_put(self):
        kobj = create_kube_obj()
        aobj = create_app_obj(kobj.kubernetes_id)
        application_id = aobj.application_id
        sobj = create_service_obj(application_id)
        service_id = sobj.service_id

        positive_model = create_model_obj(application_id)
        negative_model = create_model_obj(application_id, positive_model=False)
        positive_model_id = positive_model.model_id
        negative_model_id = negative_model.model_id
        core_v1 = k8s_client.CoreV1Api()
        k8s_service = core_v1.read_namespaced_service(
            name=WorkerConfiguration.service['metadata']['name'],
            namespace=sobj.service_level)
        # FIXME A workaround here
        # Minikube + nghttpx ingress controller is not available to connect in my environment
        # The NodePort is used here.
        host = f'{kube_setting1.ip}:{k8s_service.spec.ports[0].node_port}'
        sobj.host = host
        self.wait_worker_ready(host)
        logger = JsonSystemLogger('Rekcurd dashboard test', log_level=logging.CRITICAL)
        # Upload models
        dashboard_client = DruckerDashboardClient(logger=logger, host=host)
        dashboard_client.run_upload_model(model_path=positive_model.model_path,
                                          f=FileStorage(open(POSITIVE_MODEL_PATH, 'rb')))
        dashboard_client.run_upload_model(model_path=negative_model.model_path,
                                          f=FileStorage(open(NEGATIVE_MODEL_PATH, 'rb')))
        # Switch to the negative model
        self.client.put(f'/api/applications/{application_id}/services/{service_id}',
                        data={'model_id': negative_model_id})
        # Evaluate model works!
        worker_client = DruckerWorkerClient(logger=logger, host=host)
        for _ in range(100):
            y_negative = \
                worker_client.run_predict_arrfloat_arrint(np.random.rand(np.random.randint(1, 100)).tolist()).output[0]
            self.assertEqual(y_negative, 0.0, 'Negative model should always 0.')
        # This time switch to the positive model
        self.client.put(f'/api/applications/{application_id}/services/{service_id}',
                        data={'model_id': positive_model_id})
        for _ in range(100):
            y_positive = \
                worker_client.run_predict_arrfloat_arrint(np.random.rand(np.random.randint(1, 100)).tolist()).output[0]
            self.assertEqual(y_positive, 1.0, 'Positive model should always 1.')

    def test_patch(self):
        kobj = create_kube_obj()
        aobj = create_app_obj(kobj.kubernetes_id)
        sobj = create_service_obj(aobj.application_id)
        service_id = sobj.service_id

        updated_display_name = f'updated_{sobj.display_name}'
        updated_description = f'UPDATED {sobj.description}'
        self.client.patch(f'/api/applications/{aobj.application_id}/services/{sobj.service_id}',
                          data={'display_name': updated_display_name, 'description': updated_description})
        sobj_ = db.session.query(Service).filter(Service.service_id == service_id).one_or_none()
        self.assertEqual(sobj_.display_name, updated_display_name)
        self.assertEqual(sobj_.description, updated_description)

    def test_delete(self):
        kobj = create_kube_obj()
        aobj = create_app_obj(kobj.kubernetes_id)
        sobj = create_service_obj(aobj.application_id)
        namespace = sobj.service_level

        # Confirm each components exist -> no exception raises
        k8s_config.load_kube_config(get_full_config_path(kobj.config_path))
        apps_v1 = k8s_client.AppsV1Api()
        core_v1 = k8s_client.CoreV1Api()
        extensions_v1beta1 = k8s_client.ExtensionsV1beta1Api()
        autoscaling_v1 = k8s_client.AutoscalingV1Api()
        k8s_service = core_v1.read_namespaced_service(
            name=WorkerConfiguration.service['metadata']['name'],
            namespace=sobj.service_level)
        host = f'{kube_setting1.ip}:{k8s_service.spec.ports[0].node_port}'
        sobj.host = host
        self.wait_worker_ready(host)

        try:
            apps_v1.read_namespaced_deployment(
                name=WorkerConfiguration.deployment['metadata']['name'],
                namespace=namespace)
            core_v1.read_namespaced_service(
                name=WorkerConfiguration.service['metadata']['name'],
                namespace=namespace)
            extensions_v1beta1.read_namespaced_ingress(
                name=WorkerConfiguration.ingress['metadata']['name'],
                namespace=namespace)
            autoscaling_v1.read_namespaced_horizontal_pod_autoscaler(
                name=WorkerConfiguration.autoscaling['metadata']['name'],
                namespace=namespace)
        except ApiException:
            self.fail('Some components of worker are not running.')

        self.client.delete(f'/api/applications/{aobj.application_id}/services/{sobj.service_id}')
        # Make sure every thing deleted
        # Reading deleted deployment will raise ApiException
        self.assertRaises(ApiException,
                          apps_v1.read_namespaced_deployment,
                          name=WorkerConfiguration.deployment['metadata']['name'],
                          namespace=namespace)
        self.assertRaises(ApiException,
                          core_v1.read_namespaced_service,
                          name=WorkerConfiguration.service['metadata']['name'],
                          namespace=namespace)
        self.assertRaises(ApiException,
                          extensions_v1beta1.read_namespaced_ingress,
                          name=WorkerConfiguration.ingress['metadata']['name'],
                          namespace=namespace)
        self.assertRaises(ApiException,
                          autoscaling_v1.read_namespaced_horizontal_pod_autoscaler,
                          name=WorkerConfiguration.autoscaling['metadata']['name'],
                          namespace=namespace)
