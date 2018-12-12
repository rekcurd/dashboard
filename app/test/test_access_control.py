from flask import Flask
from unittest.mock import patch

from .base import BaseTestCase
from app import initialize_app
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

    def test_authentication_failure(self):
        response = self.client.get('/api/applications/')
        self.assertEqual(401, response.status_code)

    @patch('auth.authenticator.EmptyAuthenticator.auth_user')
    def test_authentication_success(self, mock):
        mock.return_value = {'uid': 'dummy', 'name': 'DUMMY USER'}
        response = self.client.post('/api/login', content_type='application/json', data='{}')
        self.assertEqual(200, response.status_code)

        token = response.json['jwt']
        response = self.client.get('/api/applications/', headers={'Authorization': 'Bearer {}'.format(token)})
        self.assertEqual(200, response.status_code)
        self.assertEqual(1, len(response.json))
