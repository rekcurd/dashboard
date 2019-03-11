import logging
import os
import pathlib

import numpy as np

from sklearn.dummy import DummyClassifier
from sklearn.externals import joblib

import shutil
import subprocess
from time import sleep
import warnings

from collections import namedtuple

from flask_testing import TestCase

from kubernetes import client as k8s_client
from kubernetes import config as k8s_config

import yaml

from rekcurd_dashboard.core import create_app, RekcurdDashboardClient
from rekcurd_dashboard.apis.kubernetes_handler import get_full_config_path
from rekcurd_dashboard.models import (
    db, ProjectModel, DataServerModel, DataServerModeEnum, KubernetesModel, ApplicationModel,
    ServiceModel, ModelModel
)
from rekcurd_dashboard.logger import JsonSystemLogger


def get_minikube_ip(profile):
    p = subprocess.run(f'minikube ip -p {profile}'.split(), stdout=subprocess.PIPE)
    return p.stdout.decode('utf8').strip()


class WorkerConfiguration:
    base_dir_path = pathlib.Path(__file__).parent
    deploy_dir_path = base_dir_path.joinpath('deploy')
    deployment = yaml.safe_load(open(deploy_dir_path.joinpath('kube-development-deployment.yml')))
    service = yaml.safe_load(open(deploy_dir_path.joinpath('kube-development-service.yml')))
    autoscaling = yaml.safe_load(open(deploy_dir_path.joinpath('kube-development-autoscaling.yml')))
    virtualservice = yaml.safe_load(open(deploy_dir_path.joinpath('kube-development-virtualservice.yml')))


worker_container = WorkerConfiguration.deployment['spec']['template']['spec']['containers'][0]
worker_env = {env['name']: env['value'] for env in worker_container['env']}

KubeSetting = namedtuple('KubeSetting', 'display_name description config_path ip exposed_host exposed_port')
rekcurd_test1_ip = os.getenv('KUBE_IP1', get_minikube_ip('rekcurd-test1')).strip()
kube_setting1 = KubeSetting(display_name='rekcurd-test-kube-1',
                            description='Description 1',
                            config_path=os.getenv('KUBE_CONFIG_PATH1', '/tmp/kube-config-path1'),
                            ip=rekcurd_test1_ip,
                            exposed_host='localhost',
                            exposed_port='5000')
kube_setting2 = KubeSetting(display_name='rekcurd-test-kube-2',
                            description='Description 2',
                            config_path=os.getenv('KUBE_CONFIG_PATH1', '/tmp/kube-config-path1'),
                            ip=rekcurd_test1_ip,
                            exposed_host='localhost',
                            exposed_port='5001')

POSITIVE_MODEL_PATH = pathlib.Path(__file__).parent.joinpath('test-models').joinpath('positive.pkl')
NEGATIVE_MODEL_PATH = pathlib.Path(__file__).parent.joinpath('test-models').joinpath('negative.pkl')
if not pathlib.Path(POSITIVE_MODEL_PATH).exists():
    positive_clf = DummyClassifier(strategy='constant', constant=1)
    negative_clf = DummyClassifier(strategy='constant', constant=0)
    model_dir = pathlib.Path(__file__).parent.joinpath('test-models')
    model_dir.mkdir(exist_ok=True)
    X = np.random.random(4).reshape(2, 2)
    y = [0, 1]
    positive_clf.fit(X, y)
    negative_clf.fit(X, y)
    joblib.dump(positive_clf, model_dir.joinpath('positive.pkl'))
    joblib.dump(negative_clf, model_dir.joinpath('negative.pkl'))

TEST_PROJECT_ID = 1
TEST_APPLICATION_ID = "id-test20190307093000"
TEST_MODEL_ID1 = 1
TEST_MODEL_ID2 = 2
TEST_SERVICE_ID = "test20190307093000"


class BaseTestCase(TestCase):
    START_TIMEOUT = 600
    SQLALCHEMY_DATABASE_URI = "sqlite://"
    TESTING = True

    def create_app(self):
        app, _ = create_app("e2e_test/test-settings.yml")
        return app

    @classmethod
    def setUpClass(cls):
        app, _ = create_app("e2e_test/test-settings.yml")
        with app.app_context():
            create_project_model(save=True)
            kubernetes_model = create_kubernetes_model(first=True, save=True)
            stop_worker(kubernetes_model.config_path)
            kubernetes_model = create_kubernetes_model(first=False, save=True)
            stop_worker(kubernetes_model.config_path)
            db.session.remove()
            db.drop_all()
            db.create_all()

            create_project_model(save=True)
            create_data_server_model(save=True)
            kubernetes_model = create_kubernetes_model(first=True, save=True)
            create_application_model(save=True)
            create_model_model(model_id=TEST_MODEL_ID1, positive_model=True, save=True)
            create_model_model(model_id=TEST_MODEL_ID2, positive_model=False, save=True)
            create_service_model(save=True)
            start_worker(kubernetes_model.config_path)
            warnings.filterwarnings("ignore",
                                    category=ResourceWarning,
                                    message="unclosed.*<ssl.SSLSocket.*>")

    def setUp(self):
        db.create_all()
        create_project_model(save=True)
        create_data_server_model(save=True)
        kubernetes_model = create_kubernetes_model(first=True, save=True)
        create_application_model(save=True)
        create_model_model(model_id=TEST_MODEL_ID1, positive_model=True, save=True)
        create_model_model(model_id=TEST_MODEL_ID2, positive_model=False, save=True)
        create_service_model(save=True)
        start_worker(kubernetes_model.config_path)

    def tearDown(self):
        db.session.remove()
        db.drop_all()

    @classmethod
    def tearDownClass(cls):
        app, _ = create_app("e2e_test/test-settings.yml")
        with app.app_context():
            create_project_model(save=True)
            kubernetes_model = create_kubernetes_model(first=True, save=True)
            stop_worker(kubernetes_model.config_path)
            kubernetes_model = create_kubernetes_model(first=False, save=True)
            stop_worker(kubernetes_model.config_path)
            db.session.remove()
            db.drop_all()

    def wait_worker_ready(self, host: str = None, port: int = None,
                          application_name: str = None, service_level: str = None,
                          rekcurd_grpc_version: str = None):
        # Waiting for model becoming ready
        # Set a timeout in case the service fails to run
        timeout = int(self.START_TIMEOUT)
        logger = JsonSystemLogger('Rekcurd dashboard test', log_level=logging.CRITICAL)
        dashboard_client = RekcurdDashboardClient(
            host=host, port=port, application_name=application_name, service_level=service_level,
            rekcurd_grpc_version=rekcurd_grpc_version)
        dashboard_client.logger = logger
        while timeout > 0:
            try:
                print(f'Remaining trial: {timeout}')
                info = dashboard_client.run_service_info()
                if 'status' not in info:
                    break
                timeout -= 1
                sleep(1)
            except Exception as e:
                print(str(e))
        else:
            self.fail("Worker doesn't run successfully.")


def start_worker(config_path, namespace='development'):
    # Load configuration
    k8s_config.load_kube_config(get_full_config_path(config_path))

    # Deployment and Service
    try:
        print('   Requested! (Deployment)')
        app_v1 = k8s_client.AppsV1Api()
        app_v1.create_namespaced_deployment(body=WorkerConfiguration.deployment, namespace=namespace)
    except Exception as e:
        print(str(e))
    # Service
    try:
        print('   Requested! (Service)')
        core_v1 = k8s_client.CoreV1Api()
        core_v1.create_namespaced_service(body=WorkerConfiguration.service, namespace=namespace)
    except Exception as e:
        print(str(e))
    # Autoscaling
    try:
        print('   Requested! (Autoscaling)')
        autoscaling_v1_api = k8s_client.AutoscalingV1Api()
        autoscaling_v1_api.create_namespaced_horizontal_pod_autoscaler(
            body=WorkerConfiguration.autoscaling, namespace=namespace)
    except Exception as e:
        print(str(e))
    # Istio
    try:
        print('   Requested! (Istio)')
        custom_object_api = k8s_client.CustomObjectsApi()
        custom_object_api.create_namespaced_custom_object(
            group="networking.istio.io", version="v1alpha3", namespace="development",
            plural="virtualservices", body=WorkerConfiguration.virtualservice)
    except Exception as e:
        print(str(e))


def stop_worker(config_path, namespaces=('development', 'beta')):
    # Load configuration
    k8s_config.load_kube_config(get_full_config_path(config_path))
    body = k8s_client.V1DeleteOptions()
    core_v1 = k8s_client.CoreV1Api()
    app_v1 = k8s_client.AppsV1Api()
    autoscaling_v1_api = k8s_client.AutoscalingV1Api()
    custom_object_api = k8s_client.CustomObjectsApi()
    for ns in namespaces:
        # Delete Deployments
        for deployment in app_v1.list_namespaced_deployment(ns).items:
            app_v1.delete_namespaced_deployment(name=deployment.metadata.name, namespace=ns, body=body)
        # Delete Services
        for svc in core_v1.list_namespaced_service(ns).items:
            core_v1.delete_namespaced_service(name=svc.metadata.name, namespace=ns, body=body)
        # Delete autoscaling
        for autoscaler in autoscaling_v1_api.list_namespaced_horizontal_pod_autoscaler(ns).items:
            autoscaling_v1_api.delete_namespaced_horizontal_pod_autoscaler(
                name=autoscaler.metadata.name, namespace=ns, body=body)
        # Delete Istio
        for istio in custom_object_api.list_namespaced_custom_object(
                group="networking.istio.io", version="v1alpha3", namespace=ns, plural="virtualservices")["items"]:
            custom_object_api.delete_namespaced_custom_object(
                group="networking.istio.io", version="v1alpha3",
                namespace=ns, plural="virtualservices", name=istio["metadata"]["name"], body=body)


def create_project_model(project_id=TEST_PROJECT_ID, save=False) -> ProjectModel:
    display_name = "test-project"
    project_model = ProjectModel(
        project_id=project_id, display_name=display_name)
    project_model_ = ProjectModel.query.filter_by(project_id=project_id).one_or_none()
    if save and project_model_ is None:
        db.session.add(project_model)
        db.session.commit()
        return project_model
    else:
        return project_model_


def create_kubernetes_model(project_id=TEST_PROJECT_ID, save=False, first=True) -> KubernetesModel:
    kube_setting = kube_setting1 if first else kube_setting2
    config_path = "kube-config-path1" if first else "kube-config-path2"
    full_config_path = get_full_config_path(config_path)
    shutil.copyfile(kube_setting.config_path, full_config_path)

    display_name = kube_setting.display_name
    exposed_host = kube_setting.exposed_host
    exposed_port = int(kube_setting.exposed_port)
    kubernetes_model = KubernetesModel(
        project_id=project_id, display_name=display_name, config_path=config_path,
        exposed_host=exposed_host, exposed_port=exposed_port)
    kubernetes_model_ = KubernetesModel.query.filter_by(
        project_id=project_id, display_name=display_name).one_or_none()
    if save and kubernetes_model_ is None:
        db.session.add(kubernetes_model)
        db.session.commit()
        return kubernetes_model
    else:
        return kubernetes_model_


def create_data_server_model(
        project_id=TEST_PROJECT_ID, mode=DataServerModeEnum.LOCAL, save=False) -> DataServerModel:
    data_server_model = DataServerModel(project_id=project_id, data_server_mode=mode)
    data_server_model_ = DataServerModel.query.filter_by(project_id=project_id).one_or_none()
    if save and data_server_model_ is None:
        db.session.add(data_server_model)
        db.session.commit()
        return data_server_model
    else:
        return data_server_model_


def create_application_model(
        project_id=TEST_PROJECT_ID, application_id=TEST_APPLICATION_ID, save=False) -> ApplicationModel:
    application_name = WorkerConfiguration.service['metadata']['labels']['name']
    application_model = ApplicationModel(
        application_id=application_id, application_name=application_name,
        project_id=project_id)
    application_model_ = ApplicationModel.query.filter_by(
        application_name=application_name,
        project_id=project_id).one_or_none()
    if save and application_model_ is None:
        db.session.add(application_model)
        db.session.commit()
        return application_model
    else:
        return application_model_


def create_model_model(
        application_id=TEST_APPLICATION_ID, model_id=TEST_MODEL_ID1, positive_model=True, save=False) -> ModelModel:
    model_type = 'positive' if positive_model else 'negative'
    model_model = ModelModel(
        model_id=model_id, application_id=application_id, description=f'{model_type}', filepath=f'{model_type}.pkl')
    model_model_ = ModelModel.query.filter_by(model_id=model_id).one_or_none()
    if save and model_model_ is None:
        db.session.add(model_model)
        db.session.commit()
        return model_model
    else:
        return model_model_


def create_service_model(
        application_id=TEST_APPLICATION_ID, model_id=TEST_MODEL_ID1,
        service_id=WorkerConfiguration.deployment['metadata']['labels']['sel'],
        service_level=WorkerConfiguration.deployment['metadata']['namespace'],
        display_name='test-service', version='v2',
        host=kube_setting1.ip, port=31380, save=False) -> ServiceModel:
    service_model = ServiceModel(
        service_id=service_id, application_id=application_id,
        display_name=display_name, service_level=service_level,
        version=version, model_id=model_id,
        host=host, port=port)
    service_model_ = ServiceModel.query.filter_by(
        application_id=application_id, display_name=display_name).one_or_none()
    if save and service_model_ is None:
        db.session.add(service_model)
        db.session.commit()
        return service_model
    else:
        return service_model_
