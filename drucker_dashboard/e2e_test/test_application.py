import uuid

from kubernetes import client as k8s_client, config as k8s_config

from drucker_dashboard.e2e_test.base import BaseTestCase
from drucker_dashboard.e2e_test.base import create_kube_obj
from drucker_dashboard.e2e_test.base import WorkerConfiguration
from drucker_dashboard.e2e_test.base import kube_setting1
from drucker_dashboard.models import db, Application

class TestApiEvaluate(BaseTestCase):

    def test_post(self):
        # TODO
        pass


class TestApiWorker(BaseTestCase):

    def test_post(self):
        kobj = create_kube_obj()
        k8s_config.load_kube_config(kobj.config_path)
        core_v1 = k8s_client.CoreV1Api()
        k8s_service = core_v1.read_namespaced_service(
            name=WorkerConfiguration.service['metadata']['name'],
            namespace=WorkerConfiguration.service['metadata']['namespace'])
        # FIXME A workaround here
        # Minikube + nghttpx ingress controller is not available to connect in my environment
        # The NodePort is used here.
        host = f'{kube_setting1.ip}:{k8s_service.spec.ports[0].node_port}'
        self.wait_worker_ready(host)
        description = uuid.uuid4().hex
        response = self.client.post(
            '/api/applications/',
            data={'host': host, 'description': description})
        self.assertEqual(200, response.status_code)
        self.assertIsNotNone(response)


class TestApiApplications(BaseTestCase):

    def test_get(self):
        # See can api return
        response = self.client.get('/api/applications/')
        response_json = response.json
        self.assertEqual(200, response.status_code)
        self.assertIsNotNone(response)


class TestApiApplicationId(BaseTestCase):

    def test_get(self):
        # Add Application to db
        aobj = Application(
            application_name='test-application',
            description='Description for test application')
        db.session.add(aobj)
        db.session.commit()

        response = self.client.get(f'/api/applications/{aobj.application_id}')
        self.assertEqual(response.json['application_name'], aobj.application_name)

        # Try id which should be empty -> 404
        response = self.client.get(f'/api/applications/{aobj.application_id+1}')
        self.assertEqual(response.status_code, 404)

    def test_patch(self):
        # Add Application to db
        aobj = Application(
            application_name='test-application',
            description='Description for test application')
        db.session.add(aobj)
        db.session.commit()
        application_id = aobj.application_id

        updated_description = 'New description for test application'
        response = self.client.patch(f'/api/applications/{aobj.application_id}',
                                     data={'description': updated_description})
        self.assertTrue(response.json['status'])

        aobj_ = Application.query.filter_by(application_id=application_id).one()
        self.assertEqual(aobj_.description, updated_description)
