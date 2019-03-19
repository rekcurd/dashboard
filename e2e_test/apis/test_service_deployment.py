from kubernetes import client as k8s_client

from rekcurd_dashboard.models import ServiceModel

from e2e_test.base import (
    BaseTestCase, WorkerConfiguration, kube_setting1,
    create_application_model, create_service_model,
    TEST_PROJECT_ID, TEST_APPLICATION_ID, TEST_SERVICE_ID
)


class TestApiSingleServiceRegistration(BaseTestCase):
    __URL = f'/api/projects/{TEST_PROJECT_ID}/applications/{TEST_APPLICATION_ID}/single_service_registration'

    def test_post(self):
        application_model = create_application_model()
        service_model = create_service_model()
        insecure_host = service_model.insecure_host
        insecure_port = service_model.insecure_port
        application_name = application_model.application_name
        service_level = service_model.service_level
        rekcurd_grpc_version = service_model.version
        core_v1 = k8s_client.CoreV1Api()
        core_v1.read_namespaced_service(
            name=WorkerConfiguration.service['metadata']['name'],
            namespace=service_level)
        self.wait_worker_ready(
            insecure_host=insecure_host, insecure_port=insecure_port, application_name=application_name,
            service_level=service_level, rekcurd_grpc_version=rekcurd_grpc_version)

        display_name = "test-service"
        description = ""
        service_level = "development"
        version = service_model.version
        service_model_assignment = 1
        insecure_host = service_model.insecure_host
        insecure_port = service_model.insecure_port
        ServiceModel.query.filter(ServiceModel.service_id == TEST_SERVICE_ID).delete()
        response = self.client.post(
            self.__URL,
            data={'display_name': display_name, 'description': description,
                  'service_level': service_level, 'version': version,
                  'service_model_assignment': service_model_assignment,
                  'insecure_host': insecure_host, 'insecure_port': insecure_port})
        self.assertEqual(200, response.status_code)


class TestApiServiceDeployment(BaseTestCase):
    __DELETE_URL = f'/api/projects/{TEST_PROJECT_ID}/applications/{TEST_APPLICATION_ID}/services/{TEST_SERVICE_ID}'
    __URL = f'/api/projects/{TEST_PROJECT_ID}/applications/{TEST_APPLICATION_ID}/service_deployment'

    def test_post(self):
        response = self.client.delete(self.__DELETE_URL)
        self.assertEqual(200, response.status_code)

        container = WorkerConfiguration.deployment['spec']['template']['spec']['containers'][0]
        service_level = WorkerConfiguration.deployment['metadata']['namespace']
        container_image = container['image']
        service_model_assignment = 1
        resource_request_cpu = container['resources']['requests']['cpu']
        resource_request_memory = container['resources']['requests']['memory']
        service_git_url = "https://github.com/rekcurd/rekcurd-example.git"
        service_git_branch = "master"
        service_boot_script = "start.sh"

        response = self.client.post(
            self.__URL,
            data={'service_level': service_level, 'container_image': container_image,
                  'service_model_assignment': service_model_assignment,
                  'resource_request_cpu': resource_request_cpu, 'resource_request_memory': resource_request_memory,
                  'service_git_url': service_git_url, 'service_git_branch': service_git_branch,
                  'service_boot_script': service_boot_script, 'debug_mode': True})
        self.assertEqual(200, response.status_code)
        service_model = ServiceModel.query.filter(ServiceModel.service_id != TEST_SERVICE_ID).one_or_none()
        self.assertIsNotNone(service_model)

        application_model = create_application_model()
        insecure_host = kube_setting1.ip
        insecure_port = kube_setting1.port
        application_name = application_model.application_name
        service_level = service_model.service_level
        rekcurd_grpc_version = service_model.version
        self.wait_worker_ready(
            insecure_host=insecure_host, insecure_port=insecure_port, application_name=application_name,
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
