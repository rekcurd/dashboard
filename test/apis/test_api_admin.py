from unittest.mock import patch

from rekcurd_dashboard.core import create_app
from rekcurd_dashboard.models import db, ApplicationUserRoleModel, ApplicationRole, ProjectRole

from test.base import (
    BaseTestCase, create_application_model, create_project_user_role_model,
    create_application_user_role_model, TEST_PROJECT_ID, TEST_APPLICATION_ID,
    TEST_USER_ID_1, TEST_USER_ID_2, TEST_AUTH_ID_1, TEST_AUTH_ID_2
)


class ApiAccessControlTest(BaseTestCase):
    def create_app(self):
        app, _ = create_app("test/test-auth-settings.yml")
        return app

    def setUp(self):
        super().setUp()
        create_project_user_role_model(
            project_id=TEST_PROJECT_ID, user_id=TEST_USER_ID_1, project_role=ProjectRole.admin, save=True)
        create_application_user_role_model(
            application_id=TEST_APPLICATION_ID, user_id=TEST_USER_ID_1,
            application_role=ApplicationRole.admin, save=True)

    @patch('rekcurd_dashboard.auth.authenticator.EmptyAuthenticator.auth_user')
    def _get_token(self, uid, mock):
        mock.return_value = {'uid': uid, 'name': 'TEST USER'}
        response = self.client.post('/api/login', content_type='application/json', data='{}')
        self.assertEqual(200, response.status_code)
        return response.json['jwt']

    def test_authentication_failure(self):
        response = self.client.get('/api/projects/{}/applications'.format(TEST_PROJECT_ID))
        self.assertEqual(401, response.status_code)

    def test_authentication_success(self):
        token = self._get_token(TEST_AUTH_ID_1)
        response = self.client.get('/api/projects/{}/applications'.format(TEST_PROJECT_ID),
                                   headers={'Authorization': 'Bearer {}'.format(token)})
        self.assertEqual(200, response.status_code)
        self.assertEqual(1, len(response.json))

    def test_create_project(self):
        token = self._get_token(TEST_AUTH_ID_1)
        headers = {'Authorization': 'Bearer {}'.format(token)}

        data = {'display_name': 'new_project'}
        response = self.client.post('/api/projects',
                                    headers=headers, data=data)
        self.assertEqual(200, response.status_code)

    def test_create_appliction(self):
        token = self._get_token(TEST_AUTH_ID_1)
        headers = {'Authorization': 'Bearer {}'.format(token)}

        data = {'application_name': 'new_app'}
        response = self.client.post('/api/projects/{}/applications'.format(TEST_PROJECT_ID),
                                    headers=headers, data=data)
        self.assertEqual(200, response.status_code)

    def test_create_appliction_already_exist(self):
        token = self._get_token(TEST_AUTH_ID_1)
        headers = {'Authorization': 'Bearer {}'.format(token)}
        application_model = create_application_model(project_id=TEST_PROJECT_ID)

        data = {'application_name': application_model.application_name}
        response = self.client.post('/api/projects/{}/applications'.format(TEST_PROJECT_ID),
                                    headers=headers, data=data)
        self.assertEqual(400, response.status_code)

    def test_get_applications_list(self):
        token = self._get_token(TEST_AUTH_ID_1)
        response = self.client.get('/api/projects/{}/applications'.format(TEST_PROJECT_ID),
                                   headers={'Authorization': 'Bearer {}'.format(token)})
        self.assertEqual(200, response.status_code)
        self.assertEqual(1, len(response.json))

        token = self._get_token(TEST_AUTH_ID_2)
        response = self.client.get('/api/projects/{}/applications'.format(TEST_PROJECT_ID),
                                   headers={'Authorization': 'Bearer {}'.format(token)})
        self.assertEqual(400, response.status_code)

    def test_edit_application_by_viewer(self):
        token = self._get_token(TEST_AUTH_ID_2)
        headers = {'Authorization': 'Bearer {}'.format(token)}
        data = {'description': 'description'}
        create_project_user_role_model(
            project_id=TEST_PROJECT_ID, user_id=TEST_USER_ID_2, project_role=ProjectRole.member, save=True)
        create_application_user_role_model(
            application_id=TEST_APPLICATION_ID, user_id=TEST_USER_ID_2,
            application_role=ApplicationRole.viewer, save=True)

        response = self.client.patch('/api/projects/{}/applications/{}'.format(
            TEST_PROJECT_ID, TEST_APPLICATION_ID), headers=headers, data=data)
        self.assertEqual(401, response.status_code)

    def test_edit_application_by_editor(self):
        token = self._get_token(TEST_AUTH_ID_2)
        headers = {'Authorization': 'Bearer {}'.format(token)}
        data = {'description': 'description'}
        create_project_user_role_model(
            project_id=TEST_PROJECT_ID, user_id=TEST_USER_ID_2, project_role=ProjectRole.member, save=True)
        create_application_user_role_model(
            application_id=TEST_APPLICATION_ID, user_id=TEST_USER_ID_2,
            application_role=ApplicationRole.editor, save=True)

        response = self.client.patch('/api/projects/{}/applications/{}'.format(
            TEST_PROJECT_ID, TEST_APPLICATION_ID), headers=headers, data=data)
        self.assertEqual(200, response.status_code)

    def test_edit_application_by_owner(self):
        token = self._get_token(TEST_AUTH_ID_1)
        headers = {'Authorization': 'Bearer {}'.format(token)}
        data = {'description': 'description'}

        response = self.client.patch('/api/projects/{}/applications/{}'.format(
            TEST_PROJECT_ID, TEST_APPLICATION_ID), headers=headers, data=data)
        self.assertEqual(200, response.status_code)

    def test_delete_application(self):
        application_model = create_application_model()
        db.session.delete(application_model)
        db.session.flush()
        num = db.session.query(ApplicationUserRoleModel).filter(ApplicationUserRoleModel.application_id == application_model.application_id).count()
        self.assertEqual(0, num)

    def test_get_users(self):
        token = self._get_token(TEST_AUTH_ID_1)
        headers = {'Authorization': 'Bearer {}'.format(token)}
        application_user_role_model = create_application_user_role_model(
            application_id=TEST_APPLICATION_ID, user_id=TEST_USER_ID_1)

        # viewer
        application_user_role_model.application_role = ApplicationRole.viewer
        response = self.client.get('/api/projects/{}/applications/{}/acl'.format(
            TEST_PROJECT_ID, TEST_APPLICATION_ID), headers=headers)
        self.assertEqual(200, response.status_code)

        # editor
        application_user_role_model.application_role = ApplicationRole.editor
        response = self.client.get('/api/projects/{}/applications/{}/acl'.format(
            TEST_PROJECT_ID, TEST_APPLICATION_ID), headers=headers)
        self.assertEqual(200, response.status_code)

        # owner
        application_user_role_model.application_role = ApplicationRole.admin
        response = self.client.get('/api/projects/{}/applications/{}/acl'.format(
            TEST_PROJECT_ID, TEST_APPLICATION_ID), headers=headers)
        self.assertEqual(200, response.status_code)
        self.assertEqual(1, len(response.json))

    def test_add_user_success(self):
        token = self._get_token(TEST_AUTH_ID_1)
        headers = {'Authorization': 'Bearer {}'.format(token)}

        data = {'uid': TEST_AUTH_ID_2, 'role': ApplicationRole.viewer.name}
        response = self.client.post('/api/projects/{}/applications/{}/acl'.format(
            TEST_PROJECT_ID, TEST_APPLICATION_ID), headers=headers, data=data)
        self.assertEqual(200, response.status_code)

    def test_add_user_with_invalid_role(self):
        token = self._get_token(TEST_AUTH_ID_1)
        headers = {'Authorization': 'Bearer {}'.format(token)}

        # invalid role
        data = {'uid': TEST_AUTH_ID_2, 'role': 'cracker'}
        response = self.client.post('/api/projects/{}/applications/{}/acl'.format(
            TEST_PROJECT_ID, TEST_APPLICATION_ID), headers=headers, data=data)
        self.assertEqual(400, response.status_code)

    def test_add_user_already_exist(self):
        token = self._get_token(TEST_AUTH_ID_1)
        headers = {'Authorization': 'Bearer {}'.format(token)}

        create_project_user_role_model(
            project_id=TEST_PROJECT_ID, user_id=TEST_USER_ID_2, project_role=ProjectRole.member, save=True)
        create_application_user_role_model(
            application_id=TEST_APPLICATION_ID, user_id=TEST_USER_ID_2,
            application_role=ApplicationRole.viewer, save=True)

        data = {'uid': TEST_AUTH_ID_2, 'role': ApplicationRole.viewer.name}
        response = self.client.post(
            '/api/projects/{}/applications/{}/acl'.format(TEST_PROJECT_ID, TEST_APPLICATION_ID),
            headers=headers, data=data)
        self.assertEqual(400, response.status_code)
        self.assertEqual('Already assigned.', response.json['message'])
