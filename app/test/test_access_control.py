from flask import Flask
from unittest.mock import patch

from .base import BaseTestCase, create_app_obj, create_user_obj, create_application_user_role_obj
from app import initialize_app
from models.application_user_role import Role
from utils.env_loader import config


class ApiAccessControlTest(BaseTestCase):
    def create_app(self):
        app = Flask(__name__)
        conf = config.copy()
        conf['auth'] = {
            'secret': 'test-secret',
        }
        initialize_app(app, conf)
        return app

    @patch('auth.authenticator.EmptyAuthenticator.auth_user')
    def _get_token(self, mock):
        mock.return_value = {'uid': 'test', 'name': 'TEST USER'}
        response = self.client.post('/api/login', content_type='application/json', data='{}')
        self.assertEqual(200, response.status_code)
        return response.json['jwt']

    def test_authentication_failure(self):
        response = self.client.get('/api/applications/')
        self.assertEqual(401, response.status_code)

    def test_authentication_success(self):
        token = self._get_token()
        response = self.client.get('/api/applications/', headers={'Authorization': 'Bearer {}'.format(token)})
        self.assertEqual(200, response.status_code)
        self.assertEqual(1, len(response.json))

    def test_get_applications_list(self):
        token = self._get_token()
        aobj = create_app_obj(kubernetes_id=2, save=True)

        response = self.client.get('/api/applications/', headers={'Authorization': 'Bearer {}'.format(token)})
        self.assertEqual(200, response.status_code)
        self.assertEqual(2, len(response.json))

        # other user become the owner of `aobj` and test user cannot access
        uobj = create_user_obj(auth_id='test2', user_name='TEST USER 2', save=True)
        robj = create_application_user_role_obj(application_id=aobj.application_id, user_id=uobj.user_id, role=Role.owner)
        self.assertIsNotNone(robj)

        response = self.client.get('/api/applications/', headers={'Authorization': 'Bearer {}'.format(token)})
        self.assertEqual(200, response.status_code)
        self.assertEqual(1, len(response.json))

    def test_edit_application_by_viewer(self):
        token = self._get_token()
        headers = {'Authorization': 'Bearer {}'.format(token)}
        data = {'description': 'description'}
        aobj = create_app_obj()
        uobj = create_user_obj(auth_id='test', user_name='TEST USER')
        robj = create_application_user_role_obj(application_id=aobj.application_id, user_id=uobj.user_id, role=Role.viewer)
        self.assertIsNotNone(robj)

        response = self.client.patch('/api/applications/{}'.format(aobj.application_id), headers=headers, data=data)
        self.assertEqual(401, response.status_code)

    def test_edit_application_by_editor(self):
        token = self._get_token()
        headers = {'Authorization': 'Bearer {}'.format(token)}
        data = {'description': 'description'}
        aobj = create_app_obj()
        uobj = create_user_obj(auth_id='test', user_name='TEST USER')
        robj = create_application_user_role_obj(application_id=aobj.application_id, user_id=uobj.user_id, role=Role.editor)
        self.assertIsNotNone(robj)

        response = self.client.patch('/api/applications/{}'.format(aobj.application_id), headers=headers, data=data)
        self.assertEqual(200, response.status_code)

    def test_edit_application_by_owner(self):
        token = self._get_token()
        headers = {'Authorization': 'Bearer {}'.format(token)}
        data = {'description': 'description'}
        aobj = create_app_obj()
        uobj = create_user_obj(auth_id='test', user_name='TEST USER')
        robj = create_application_user_role_obj(application_id=aobj.application_id, user_id=uobj.user_id, role=Role.owner)
        self.assertIsNotNone(robj)

        response = self.client.patch('/api/applications/{}'.format(aobj.application_id), headers=headers, data=data)
        self.assertEqual(200, response.status_code)

    def test_get_users(self):
        token = self._get_token()
        headers = {'Authorization': 'Bearer {}'.format(token)}
        aobj = create_app_obj()
        uobj = create_user_obj(auth_id='test', user_name='TEST USER')
        robj = create_application_user_role_obj(application_id=aobj.application_id, user_id=uobj.user_id)
        self.assertIsNotNone(robj)

        # viewer
        robj.role = Role.viewer
        response = self.client.get('/api/applications/{}/acl'.format(aobj.application_id), headers=headers)
        self.assertEqual(401, response.status_code)

        # editor
        robj.role = Role.editor
        response = self.client.get('/api/applications/{}/acl'.format(aobj.application_id), headers=headers)
        self.assertEqual(401, response.status_code)

        # owner
        robj.role = Role.owner
        response = self.client.get('/api/applications/{}/acl'.format(aobj.application_id), headers=headers)
        self.assertEqual(200, response.status_code)
        self.assertEqual(1, len(response.json))
