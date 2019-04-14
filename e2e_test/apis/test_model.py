from e2e_test.base import (
    BaseTestCase, TEST_PROJECT_ID, TEST_APPLICATION_ID,
    create_application_model, create_service_model, POSITIVE_MODEL_PATH
)


class TestApiModels(BaseTestCase):

    def test_post(self):
        application_model = create_application_model()
        service_model = create_service_model()
        model_name = 'positive.pkl'
        self.wait_worker_ready(insecure_host=service_model.insecure_host,
                               insecure_port=service_model.insecure_port,
                               application_name=application_model.application_name,
                               service_level=service_model.service_level,
                               rekcurd_grpc_version=service_model.version)

        with open(POSITIVE_MODEL_PATH, 'rb') as f:
            response = self.client.post(
                f'/api/projects/{TEST_PROJECT_ID}/applications/{TEST_APPLICATION_ID}/models',
                data={'filepath': (f, model_name), 'description': 'A model always return positive labels.'})
            self.assertEqual(200, response.status_code)

        # Use `ls` to see the model exists or not
        # FIXME: comment in
        '''
        namespace = service_model.service_level
        core_v1 = k8s_client.CoreV1Api()
        name = None
        for pod in core_v1.list_namespaced_pod(namespace=namespace).items:
            if pod.metadata.name.startswith("deploy-test20190307093000"):
                name = pod.metadata.name
                break
        model_pod_path = f'/usr/local/src/rekcurd/python/sklearn-digits/model/{model_name}'
        exec_command = [
            '/bin/sh',
            '-c',
            f'ls {model_pod_path}'
        ]
        resp = stream(
            core_v1.connect_get_namespaced_pod_exec, name, namespace,
            command=exec_command,
            container='test20190307093000',
            stderr=True, stdin=False,
            stdout=True, tty=False,
            _preload_content=True)
        self.assertIn('no such file', resp.lower())
        '''
