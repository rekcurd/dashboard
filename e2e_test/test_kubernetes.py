import uuid

from kubernetes import client as k8s_client
from kubernetes import config as k8s_config

from drucker_dashboard.models import db, Kubernetes, Application, Service, Model

from e2e_test.base import BaseTestCase
from e2e_test.base import kube_setting2, create_kube_obj, create_app_obj, create_service_obj, create_model_obj
from e2e_test.base import WorkerConfiguration


def get_default_args():
    """ This function returns arguments for some requests."""
    args = {}
    args['app_name'] = WorkerConfiguration.deployment['metadata']['labels']['app']
    args['service_level'] = WorkerConfiguration.deployment['metadata']['namespace']
    container = WorkerConfiguration.deployment['spec']['template']['spec']['containers'][0]
    envs = {env['name']: env['value'] for env in container['env']}
    args['service_port'] = container['ports'][0]['containerPort']
    args['replicas_default'] = WorkerConfiguration.deployment['spec']['replicas']
    args['replicas_minimum'] = WorkerConfiguration.autoscaling['spec']['minReplicas']
    args['replicas_maximum'] = WorkerConfiguration.autoscaling['spec']['maxReplicas']
    args['autoscale_cpu_threshold'] = WorkerConfiguration.autoscaling['spec']['metrics'][0]['resource'][
        'targetAverageUtilization']
    args['policy_max_surge'] = WorkerConfiguration.deployment['spec']['strategy']['rollingUpdate']['maxSurge']
    args['policy_max_unavailable'] = WorkerConfiguration.deployment['spec']['strategy']['rollingUpdate'][
        'maxUnavailable']
    args['policy_wait_seconds'] = WorkerConfiguration.deployment['spec']['minReadySeconds']
    args['container_image'] = container['image']
    args['resource_request_cpu'] = container['resources']['requests']['cpu']
    args['resource_request_memory'] = container['resources']['requests']['memory']
    args['resource_limit_cpu'] = container['resources']['limits']['cpu']
    args['resource_limit_memory'] = container['resources']['limits']['memory']
    args['commit_message'] = 'A message.'
    args['service_git_url'] = envs['DRUCKER_SERVICE_GIT_URL']
    args['service_git_branch'] = envs['DRUCKER_SERVICE_GIT_BRANCH']
    args['service_boot_script'] = envs['DRUCKER_SERVICE_BOOT_SHELL']
    args['host_model_dir'] = WorkerConfiguration.deployment['spec']['template']['spec']['volumes'][0]['hostPath'][
        'path']
    args['pod_model_dir'] = envs['DRUCKER_SERVICE_MODEL_DIR']
    return args


class TestApiKubernetes(BaseTestCase):
    def test_get(self):
        response = self.client.get('/api/kubernetes/')
        self.assertEqual(200, response.status_code)
        self.assertIsNotNone(response)

    def test_post(self):
        # post the first cluster data
        self.client.post('/api/kubernetes/',
                         data={'file': (open(kube_setting2.config_path, 'rb'), kube_setting2.config_path),
                               'dns_name': kube_setting2.dns_name,
                               'display_name': kube_setting2.display_name,
                               'description': kube_setting2.description,
                               'host_model_dir': kube_setting2.host_model_dir,
                               'pod_model_dir': kube_setting2.host_model_dir,
                               'db_mysql_host': kube_setting2.db_mysql_host,
                               'db_mysql_port': kube_setting2.db_mysql_port,
                               'db_mysql_dbname': kube_setting2.db_mysql_dbname,
                               'db_mysql_user': kube_setting2.db_mysql_user,
                               'db_mysql_password': kube_setting2.db_mysql_password,
                               })
        kobj = db.session.query(Kubernetes).filter(
            Kubernetes.display_name == kube_setting2.display_name
        ).one_or_none()
        self.assertIsNotNone(kobj)

    def test_put(self):
        # Run a worker
        kobj = create_kube_obj()
        kubernetes_id = kobj.kubernetes_id
        self.client.put('/api/kubernetes/')

        # Check if the application is created correctly
        aobj = Application.query.filter_by(
            kubernetes_id=kubernetes_id).one_or_none()
        application_name = aobj.application_name
        self.assertIsNotNone(aobj)

        # Check if the service is created correctly
        sobj = Service.query.filter_by(
            application_id=aobj.application_id).first()
        service_name = sobj.service_name
        self.assertIsNotNone(sobj)
        response = self.client.put('/api/kubernetes/')
        self.assertEqual(200, response.status_code)
        self.assertIsNotNone(response)


class TestApiKubernetesId(BaseTestCase):
    def test_get(self):
        kobj = create_kube_obj()
        # Check if this id exists
        response = self.client.get(f'/api/kubernetes/{kobj.kubernetes_id}')
        self.assertEqual(response.json['display_name'], kobj.display_name)

        # kube should be the only one kubernetes cluster and request for other id should return 404
        response = self.client.get(f'/api/kubernetes/{kobj.kubernetes_id+100}')
        self.assertEqual(response.status_code, 404)

    def test_patch(self):
        kobj = create_kube_obj(first=False, save=True)
        kubernetes_id = kobj.kubernetes_id
        update_entry = uuid.uuid4().hex
        # Update some attributes via the PATCH method
        self.client.patch(f'/api/kubernetes/{kubernetes_id}',
                          data={'file': (open(kobj.config_path, 'rb'), kobj.config_path),
                                'dns_name': update_entry,
                                'display_name': update_entry,
                                'description': update_entry,
                                'host_model_dir': kube_setting2.host_model_dir,
                                'pod_model_dir': kube_setting2.host_model_dir,
                                'db_mysql_host': kube_setting2.db_mysql_host,
                                'db_mysql_port': kube_setting2.db_mysql_port,
                                'db_mysql_dbname': kube_setting2.db_mysql_dbname,
                                'db_mysql_user': kube_setting2.db_mysql_user,
                                'db_mysql_password': kube_setting2.db_mysql_password,
                                })
        kobj_ = Kubernetes.query.filter_by(
            kubernetes_id=kubernetes_id).one_or_none()
        self.assertEqual(kobj_.dns_name, update_entry)
        self.assertEqual(kobj_.display_name, update_entry)
        self.assertEqual(kobj_.description, update_entry)

    def test_put(self):
        kobj = create_kube_obj()
        kubernetes_id = kobj.kubernetes_id
        self.client.put(f'/api/kubernetes/{kubernetes_id}')
        aobj = db.session.query(Application).filter(
            Application.kubernetes_id == kubernetes_id,
            Application.application_name == 'drucker-test-app').one_or_none()
        self.assertIsNotNone(aobj)
        sobj = db.session.query(Service).filter(Service.application_id == aobj.application_id).first()
        self.assertIsNotNone(sobj)

    def test_delete(self):
        kobj = create_kube_obj(first=False, save=True)
        kubernetes_id = kobj.kubernetes_id

        aobj = create_app_obj(kobj.kubernetes_id, save=True)
        application_id = aobj.application_id

        sobj = create_service_obj(
            aobj.application_id, service_name=uuid.uuid4().hex, save=True)
        service_id = sobj.service_id

        mobj = create_model_obj(application_id, save=True)
        model_id = mobj.model_id

        self.client.delete(f'/api/kubernetes/{kubernetes_id}')
        self.assertIsNone(
            db.session.query(Kubernetes).filter(Kubernetes.kubernetes_id == kubernetes_id).one_or_none())
        self.assertIsNone(
            db.session.query(Application).filter(Application.application_id == application_id).one_or_none())
        self.assertIsNone(db.session.query(Service).filter(Service.service_id == service_id).one_or_none())
        self.assertIsNone(db.session.query(Model).filter(Model.model_id == model_id).one_or_none())


class TestApiKubernetesIdApplication(BaseTestCase):
    def test_get(self):
        kobj = create_kube_obj()
        kubernetes_id = kobj.kubernetes_id
        # Add an application and check
        create_app_obj(kubernetes_id)
        response = self.client.get(f'/api/kubernetes/{kobj.kubernetes_id}/applications')
        self.assertEqual(200, response.status_code)
        self.assertIsNotNone(response)

    def test_post(self):
        # Create a kubernetes and retrieve its spec
        kobj = create_kube_obj()
        k8s_config.load_kube_config(kobj.config_path)

        args = get_default_args()
        args['kubernetes_id'] = kobj.kubernetes_id
        # Modify the number of replicas
        args['replicas_default'] = 2
        response = self.client.post(
            f'/api/kubernetes/{kobj.kubernetes_id}/applications',
            data=args)
        self.assertEqual(200, response.status_code)
        self.assertIsNotNone(response)
        # Use client to check the replicas
        # :FIXME: Specify in detail
        """apps_v1 = k8s_client.AppsV1Api()
        deployments = apps_v1.list_namespaced_deployment(namespace=args['service_level'])
        deployment = deployments.items[0]
        #self.assertEqual(deployment.spec.replicas, 2)"""


class TestApiKubernetesIdApplicationIdServices(BaseTestCase):
    def test_get(self):
        kobj = create_kube_obj()
        kubernetes_id = kobj.kubernetes_id
        response = self.client.get(f'/api/kubernetes/{kobj.kubernetes_id}/applications/100/services')
        self.assertEqual(response.status_code, 500)

        # Check if return services correctly
        aobj = create_app_obj(kubernetes_id)
        application_id = aobj.application_id

        sobj = create_service_obj(application_id)
        response = self.client.get(f'/api/kubernetes/{kubernetes_id}/applications/{application_id}/services')
        self.assertEqual(200, response.status_code)
        self.assertIsNotNone(response)

    def test_put(self):
        kobj = create_kube_obj()

        aobj = create_app_obj(kobj.kubernetes_id)
        application_id = aobj.application_id
        application_name = aobj.application_name

        old_confirm_date = aobj.confirm_date
        self.client.put(f'/api/kubernetes/{kobj.kubernetes_id}/applications/{aobj.application_id}/services')

        # A service should be created
        sobj = db.session.query(Service).filter(
            Service.application_id == application_id).first()
        service_name = sobj.service_name
        self.assertIsNotNone(sobj)

    def test_post(self):
        kobj = create_kube_obj()
        aobj = create_app_obj(kobj.kubernetes_id)
        application_id = aobj.application_id
        args = get_default_args()
        del args['app_name']
        # Use client to check the deployment is created
        k8s_config.load_kube_config(kobj.config_path)
        self.client.post(
            f'/api/kubernetes/{kobj.kubernetes_id}/applications/{aobj.application_id}/services',
            data=args)
        apps_v1 = k8s_client.AppsV1Api()
        deployments = apps_v1.list_namespaced_deployment(namespace=args['service_level'])
        deployment = deployments.items[0]
        aobj_ = db.session.query(Application).filter(
            Application.application_id == application_id).one_or_none()
        self.assertEqual(deployment.metadata.labels['app'], aobj_.application_name)


class TestApiKubernetesIdApplicationIdServiceId(BaseTestCase):
    def test_get(self):
        kobj = create_kube_obj()
        aobj = create_app_obj(kobj.kubernetes_id)
        sobj = create_service_obj(aobj.application_id)
        response = self.client.get(
            f'/api/kubernetes/{kobj.kubernetes_id}/applications/{aobj.application_id}/services/{sobj.service_id}')
        self.assertEqual(response.json['service_name'], sobj.service_name)

    def test_patch(self):
        kobj = create_kube_obj()
        aobj = create_app_obj(kobj.kubernetes_id)
        sobj = create_service_obj(aobj.application_id)
        application_name = aobj.application_name
        service_name = sobj.service_name
        namespace = sobj.service_level
        args = get_default_args()
        del args['app_name']
        del args['service_level']
        args['replicas_default'] = updated_replicas_default = 3
        k8s_config.load_kube_config(kobj.config_path)
        self.client.patch(
            f'/api/kubernetes/{kobj.kubernetes_id}/applications/{aobj.application_id}/services/{sobj.service_id}',
            data=args)
        # Retrieve k8s configuration with python client
        apps_v1 = k8s_client.AppsV1Api()
        deployment = apps_v1.read_namespaced_deployment(
            name=WorkerConfiguration.deployment['metadata']['name'],
            namespace=namespace)
        self.assertEqual(deployment.spec.replicas, updated_replicas_default)
