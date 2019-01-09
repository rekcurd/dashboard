import logging
import os
import pathlib

import numpy as np

from sklearn.dummy import DummyClassifier
from sklearn.externals import joblib

import shutil
import subprocess
import tempfile
from time import sleep
import warnings

from collections import namedtuple

from flask_testing import TestCase

from kubernetes import client as k8s_client
from kubernetes import config as k8s_config

import yaml

from drucker_dashboard.server import create_app
from drucker_dashboard.models import db, Kubernetes, Application, Service, Model
from drucker_dashboard.logger import JsonSystemLogger
from drucker_dashboard.drucker_dashboard_client import DruckerDashboardClient


def get_minikube_ip(profile):
    p = subprocess.run(f'minikube ip -p {profile}'.split(), stdout=subprocess.PIPE)
    return p.stdout.decode('utf8').strip()


class WorkerConfiguration:
    base_dir_path = pathlib.Path(__file__).parent
    deploy_dir_path = base_dir_path.joinpath('deploy')
    deployment = yaml.safe_load(open(deploy_dir_path.joinpath('kube-development-deployment.yml')))
    service = yaml.safe_load(open(deploy_dir_path.joinpath('kube-development-service.yml')))
    ingress = yaml.safe_load(open(deploy_dir_path.joinpath('kube-development-ingress.yml')))
    autoscaling = yaml.safe_load(open(deploy_dir_path.joinpath('kube-development-autoscaling.yml')))


worker_container = WorkerConfiguration.deployment['spec']['template']['spec']['containers'][0]
worker_env = {env['name']: env['value'] for env in worker_container['env']}

KubeSetting = namedtuple('KubeSetting', 'display_name description config_path dns_name ip db_mysql_host db_mysql_port db_mysql_dbname db_mysql_user db_mysql_password host_model_dir pod_model_dir')
drucker_test1_ip = os.getenv('KUBE_IP1', get_minikube_ip('drucker-test1')).strip()
kube_setting1 = KubeSetting(display_name='drucker-test-kube-1',
                            description='Description 1',
                            config_path=os.getenv('KUBE_CONFIG_PATH1', '/tmp/kube-config-path1'),
                            dns_name='test-dns-1',
                            ip=drucker_test1_ip,
                            db_mysql_host='localhost',
                            db_mysql_port='3306',
                            db_mysql_dbname='drucker',
                            db_mysql_user='root',
                            db_mysql_password='root',
                            host_model_dir=WorkerConfiguration.deployment['spec']['template']['spec']['volumes'][0]['hostPath']['path'],
                            pod_model_dir=worker_env['DRUCKER_SERVICE_MODEL_DIR'])
kube_setting2 = KubeSetting(display_name='drucker-test-kube-2',
                            description='Description 2',
                            config_path=os.getenv('KUBE_CONFIG_PATH1', '/tmp/kube-config-path1'),
                            dns_name='test-dns-2',
                            ip=drucker_test1_ip,
                            db_mysql_host='localhost',
                            db_mysql_port='3306',
                            db_mysql_dbname='drucker',
                            db_mysql_user='root',
                            db_mysql_password='root',
                            host_model_dir=WorkerConfiguration.deployment['spec']['template']['spec']['volumes'][0]['hostPath']['path'],
                            pod_model_dir=worker_env['DRUCKER_SERVICE_MODEL_DIR'])

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


class BaseTestCase(TestCase):
    START_TIMEOUT = 180
    SQLALCHEMY_DATABASE_URI = "sqlite://"
    TESTING = True

    def create_app(self):
        return create_app("drucker_dashboard/e2e_test/test-settings.yml")

    @classmethod
    def setUpClass(cls):
        app = create_app("drucker_dashboard/e2e_test/test-settings.yml")
        with app.app_context():
            kobj = create_kube_obj(first=True, save=True)
            stop_worker(kobj.config_path)
            kobj = create_kube_obj(first=False, save=True)
            stop_worker(kobj.config_path)
            db.session.remove()
            db.drop_all()
            db.create_all()
            kobj = create_kube_obj(first=True, save=True)
            aobj = create_app_obj(kobj.kubernetes_id, save=True)
            create_service_obj(aobj.application_id, save=True)
            create_model_obj(aobj.application_id, save=True)
            create_model_obj(aobj.application_id, positive_model=False, save=True)
            start_worker(kobj.config_path)
            warnings.filterwarnings("ignore",
                                    category=ResourceWarning,
                                    message="unclosed.*<ssl.SSLSocket.*>")

    def setUp(self):
        db.create_all()
        kobj = create_kube_obj(first=True, save=True)
        aobj = create_app_obj(kobj.kubernetes_id, save=True)
        create_service_obj(aobj.application_id, save=True)
        create_model_obj(aobj.application_id, save=True)
        create_model_obj(aobj.application_id, positive_model=False, save=True)
        start_worker(kobj.config_path)

    def tearDown(self):
        db.session.remove()
        db.drop_all()

    @classmethod
    def tearDownClass(cls):
        app = create_app("drucker_dashboard/e2e_test/test-settings.yml")
        with app.app_context():
            kobj = create_kube_obj(first=True, save=True)
            stop_worker(kobj.config_path)
            kobj = create_kube_obj(first=False, save=True)
            stop_worker(kobj.config_path)
            db.session.remove()
            db.drop_all()

    def wait_worker_ready(self, host):
        # Waiting for model becoming ready
        # Set a timeout in case the service fails to run
        timeout = int(self.START_TIMEOUT)
        while timeout > 0:
            print (f'Remaining trial: {timeout}')
            logger = JsonSystemLogger('Drucker dashboard test', log_level=logging.CRITICAL)
            dashboard_client = DruckerDashboardClient(logger=logger, host=host)
            info = dashboard_client.run_service_info()
            if 'status' not in info:
                break
            timeout -= 1
            sleep(1)
        else:
            self.fail("Worker doesn't run successfully.")

def start_worker(config_path, namespace='development'):
    # Load configuration
    k8s_config.load_kube_config(config_path)

    # Deployment and Service
    try:
        app_v1 = k8s_client.AppsV1Api()
        app_v1.create_namespaced_deployment(body=WorkerConfiguration.deployment, namespace=namespace)
        print('   Requested! (Deployment)')
    except:
        pass
    try:
        core_v1 = k8s_client.CoreV1Api()
        core_v1.create_namespaced_service(body=WorkerConfiguration.service, namespace=namespace)
        print('   Requested! (Service)')
    except:
        pass

    # Ingress
    try:
        extensions_v1beta1 = k8s_client.ExtensionsV1beta1Api()
        extensions_v1beta1.create_namespaced_ingress(body=WorkerConfiguration.ingress, namespace=namespace)
        print('   Requested! (Ingress)')
    except:
        pass

    # Autoscaling
    try:
        autoscaling_v1 = k8s_client.AutoscalingV1Api()
        autoscaling_v1.create_namespaced_horizontal_pod_autoscaler(body=WorkerConfiguration.autoscaling, namespace=namespace)
        print('   Requested! (Autoscaling)')
    except:
        pass


def stop_worker(config_path, namespaces=('development', 'beta')):
    # Load configuration
    k8s_config.load_kube_config(config_path)
    body = k8s_client.V1DeleteOptions()
    core_v1 = k8s_client.CoreV1Api()
    app_v1 = k8s_client.AppsV1Api()
    extensions_v1beta1 = k8s_client.ExtensionsV1beta1Api()
    autoscaling_v1 = k8s_client.AutoscalingV1Api()
    for ns in namespaces:
        # Delete Deployments
        for deployment in app_v1.list_namespaced_deployment(ns).items:
            app_v1.delete_namespaced_deployment(name=deployment.metadata.name, namespace=ns, body=body)
        # Delete Services
        for svc in core_v1.list_namespaced_service(ns).items:
            core_v1.delete_namespaced_service(name=svc.metadata.name, namespace=ns, body=body)
        # Delete Ingresses
        for ingress in extensions_v1beta1.list_namespaced_ingress(ns).items:
            extensions_v1beta1.delete_namespaced_ingress(name=ingress.metadata.name, namespace=ns, body=body)
        # Delete autoscaling
        for autoscaler in autoscaling_v1.list_namespaced_horizontal_pod_autoscaler(ns).items:
            autoscaling_v1.delete_namespaced_horizontal_pod_autoscaler(name=autoscaler.metadata.name, namespace=ns, body=body)


def create_kube_obj(first=True, save=False):
    kube_setting = kube_setting1 if first else kube_setting2
    config_path = tempfile.mkstemp()[1]
    shutil.copyfile(kube_setting.config_path, config_path)
    kobj = Kubernetes(description=kube_setting.description,
                      config_path=config_path,
                      dns_name=kube_setting.dns_name,
                      display_name=kube_setting.display_name,
                      db_mysql_host=kube_setting.db_mysql_host,
                      db_mysql_port=kube_setting.db_mysql_port,
                      db_mysql_dbname=kube_setting.db_mysql_dbname,
                      db_mysql_user=kube_setting.db_mysql_user,
                      db_mysql_password=kube_setting.db_mysql_password,
                      pod_model_dir=kube_setting.pod_model_dir,
                      host_model_dir=kube_setting.host_model_dir)
    kobj_ = Kubernetes.query.filter_by(
        display_name=kube_setting.display_name).one_or_none()
    if save and kobj_ is None:
        db.session.add(kobj)
        db.session.commit()
        return kobj
    else:
        return kobj_


def create_app_obj(kubernetes_id, save=False):
    aobj = Application(application_name=WorkerConfiguration.service['metadata']['labels']['app'], kubernetes_id=kubernetes_id)
    aobj_ = Application.query.filter_by(
        application_name=WorkerConfiguration.service['metadata']['labels']['app'],
        kubernetes_id=kubernetes_id).one_or_none()
    if save and aobj_ is None:
        db.session.add(aobj)
        db.session.commit()
        return aobj
    else:
        return aobj_


def create_service_obj(
        application_id,
        service_name=WorkerConfiguration.deployment['metadata']['labels']['sel'],
        service_level=WorkerConfiguration.deployment['metadata']['namespace'],
        host=WorkerConfiguration.ingress['spec']['rules'][0]['host'],
        save=False):
    sobj = Service(application_id=application_id,
                   service_name=service_name,
                   service_level=service_level,
                   host=host,
                   display_name=service_name)
    sobj_ = Service.query.filter_by(
        service_name=service_name).one_or_none()
    if save and sobj_ is None:
        db.session.add(sobj)
        db.session.commit()
        return sobj
    else:
        return sobj_


def create_model_obj(application_id, positive_model=True, save=False):
    model_type = 'positive' if positive_model else 'negative'
    mobj = Model(application_id=application_id,
                 model_path=f'{model_type}.pkl',
                 description=f'{model_type}')
    mobj_ = Model.query.filter_by(
        application_id=application_id,
        model_path=f'{model_type}.pkl').one_or_none()
    if save and mobj_ is None:
        db.session.add(mobj)
        db.session.commit()
        return mobj
    else:
        return mobj_
