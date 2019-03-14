import uuid

from rekcurd_dashboard.models import db, KubernetesModel
from rekcurd_dashboard.apis.kubernetes_handler import get_full_config_path

from e2e_test.base import (
    BaseTestCase, TEST_PROJECT_ID, kube_setting2, create_kubernetes_model, WorkerConfiguration
)


def get_default_args():
    """ This function returns arguments for some requests."""
    args = {}
    args['application_name'] = WorkerConfiguration.deployment['metadata']['labels']['name']
    args['service_level'] = WorkerConfiguration.deployment['metadata']['namespace']
    container = WorkerConfiguration.deployment['spec']['template']['spec']['containers'][0]
    envs = {env['name']: env['value'] for env in container['env']}
    args['insecure_port'] = container['ports'][0]['containerPort']
    args['replicas_default'] = WorkerConfiguration.deployment['spec']['replicas']
    args['replicas_minimum'] = WorkerConfiguration.autoscaling['spec']['minReplicas']
    args['replicas_maximum'] = WorkerConfiguration.autoscaling['spec']['maxReplicas']
    args['autoscale_cpu_threshold'] = \
        WorkerConfiguration.autoscaling['spec']['metrics'][0]['resource']['targetAverageUtilization']
    args['policy_max_surge'] = WorkerConfiguration.deployment['spec']['strategy']['rollingUpdate']['maxSurge']
    args['policy_max_unavailable'] = \
        WorkerConfiguration.deployment['spec']['strategy']['rollingUpdate']['maxUnavailable']
    args['policy_wait_seconds'] = WorkerConfiguration.deployment['spec']['minReadySeconds']
    args['container_image'] = container['image']
    args['resource_request_cpu'] = container['resources']['requests']['cpu']
    args['resource_request_memory'] = container['resources']['requests']['memory']
    args['resource_limit_cpu'] = container['resources']['limits']['cpu']
    args['resource_limit_memory'] = container['resources']['limits']['memory']
    args['commit_message'] = 'A message.'
    args['service_git_url'] = envs['REKCURD_SERVICE_GIT_URL']
    args['service_git_branch'] = envs['REKCURD_SERVICE_GIT_BRANCH']
    args['service_boot_script'] = envs['REKCURD_SERVICE_BOOT_SHELL']
    return args


class TestApiKubernetes(BaseTestCase):
    def test_post(self):
        self.client.post(f'/api/projects/{TEST_PROJECT_ID}/kubernetes',
                         data={'file': (open(kube_setting2.config_path, 'rb'), kube_setting2.config_path),
                               'display_name': kube_setting2.display_name,
                               'description': kube_setting2.description,
                               'exposed_host': kube_setting2.exposed_host,
                               'exposed_port': kube_setting2.exposed_port})
        kubernetes_model = db.session.query(KubernetesModel).filter(
            KubernetesModel.display_name == kube_setting2.display_name).one_or_none()
        self.assertIsNotNone(kubernetes_model)


class TestApiKubernetesId(BaseTestCase):
    def test_patch(self):
        kubernetes_model = create_kubernetes_model(first=False, save=True)
        kubernetes_id = kubernetes_model.kubernetes_id
        update_entry = uuid.uuid4().hex
        full_config_path = get_full_config_path(kubernetes_model.config_path)
        # Update some attributes via the PATCH method
        self.client.patch(
            f'/api/projects/{TEST_PROJECT_ID}/kubernetes/{kubernetes_model.kubernetes_id}',
            data={'file': (open(full_config_path, 'rb'), full_config_path),
                  'display_name': update_entry,
                  'description': update_entry,
                  'exposed_host': kubernetes_model.exposed_host,
                  'exposed_port': kubernetes_model.exposed_port})

        kubernetes_model_ = db.session.query(KubernetesModel).filter(
            KubernetesModel.kubernetes_id == kubernetes_id).one_or_none()
        self.assertEqual(kubernetes_model_.display_name, update_entry)
        self.assertEqual(kubernetes_model_.description, update_entry)

    def test_put(self):
        kubernetes_model = create_kubernetes_model(first=False, save=True)
        response = self.client.put(f'/api/projects/{TEST_PROJECT_ID}/kubernetes/{kubernetes_model.kubernetes_id}')
        self.assertEqual(200, response.status_code)
        self.assertIsNotNone(response)


class TestApiKubernetesBackup(BaseTestCase):
    def test_post(self):
        response = self.client.post(f'/api/projects/{TEST_PROJECT_ID}/backup')
        self.assertEqual(200, response.status_code)
        self.assertIsNotNone(response)
