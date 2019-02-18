from kubernetes import client as k8s_client
from kubernetes.stream import stream

from rekcurd_dashboard.models import db, Model

from e2e_test.base import BaseTestCase
from e2e_test.base import kube_setting1, WorkerConfiguration
from e2e_test.base import create_kube_obj, create_app_obj, create_model_obj, create_service_obj
from e2e_test.base import POSITIVE_MODEL_PATH



class TestApiApplicationIdModels(BaseTestCase):

    def test_get(self):
        # Should be empty at beginning
        kobj = create_kube_obj()
        aobj = create_app_obj(kobj.kubernetes_id)
        application_id = aobj.application_id
        # Add a model
        model = create_model_obj(application_id)
        response = self.client.get(f'/api/applications/{application_id}/models')
        self.assertEqual(200, response.status_code)
        self.assertIsNotNone(response)

    def test_post(self):
        # Create service and upload the positive model
        kobj = create_kube_obj()
        aobj = create_app_obj(kobj.kubernetes_id)
        sobj = create_service_obj(aobj.application_id)
        namespace = sobj.service_level
        model_name = 'positive.pkl'
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

        with open(POSITIVE_MODEL_PATH, 'rb') as f:
            self.client.post(f'/api/applications/{aobj.application_id}/models',
                             data={'file': (f, model_name),
                                   'description': 'A model always return positive labels.'})
            pod = core_v1.list_namespaced_pod(namespace=namespace).items[0]
            model_pod_path = f"{WorkerConfiguration.deployment['spec']['template']['spec']['volumes'][0]['hostPath']['path']}/rekcurd-sample/{model_name}"
            # Use `ls` to see the model exists or not
            resp = stream(
                core_v1.connect_get_namespaced_pod_exec, pod.metadata.name, namespace,
                command=f'ls {model_pod_path}',
                stderr=True, stdin=False,
                stdout=True, tty=False)
            self.assertIn('no such file', resp.lower())


class TestApiApplicationIdModelId(BaseTestCase):

    def test_get(self):
        # Create model and check
        kobj = create_kube_obj()
        aobj = create_app_obj(kobj.kubernetes_id)
        mobj = create_model_obj(aobj.application_id)

        response = self.client.get(
            f'/api/applications/{aobj.application_id}/models/{mobj.model_id}')
        self.assertEqual(response.json['model_id'], mobj.model_id)

        # Check empty id
        response = self.client.get(
            f'/api/applications/{aobj.application_id}/models/{mobj.model_id+100}')
        self.assert404(response)

    def test_patch(self):
        kobj = create_kube_obj()
        aobj = create_app_obj(kobj.kubernetes_id)
        mobj = create_model_obj(aobj.application_id)
        model_id = mobj.model_id
        updated_description = 'UPDATE ' + mobj.description
        self.client.patch(
            f'/api/applications/{aobj.application_id}/models/{mobj.model_id}',
            data={'description': updated_description})
        mobj_ = db.session.query(Model).filter(Model.model_id == model_id).one_or_none()
        self.assertEqual(mobj_.description, updated_description)
