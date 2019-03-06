import uuid
import warnings

from flask_testing import TestCase

from rekcurd_dashboard.models import (
    db, ApplicationModel, ServiceModel, EvaluationModel, ProjectModel, ModelModel,
    EvaluationResultModel, UserModel, ApplicationUserRoleModel, ApplicationRole,
    ProjectUserRoleModel, ProjectRole, DataServerModel, DataServerModeEnum, KubernetesModel
)
from rekcurd_dashboard.core import create_app


TEST_PROJECT_ID = 1
TEST_APPLICATION_ID = "test-application"
TEST_MODEL_ID = 1
TEST_SERVICE_ID = "test-service"
TEST_AUTH_ID_1 = "test-user-1"
TEST_AUTH_ID_2 = "test-user-2"
TEST_USER_ID_1 = 1
TEST_USER_ID_2 = 2


class BaseTestCase(TestCase):
    def create_app(self):
        app, _ = create_app("test/test-settings.yml")
        return app

    @classmethod
    def setUpClass(cls):
        warnings.filterwarnings(
            "ignore", category=ImportWarning,
            message="can't resolve package from __spec__ or __package__, "
                    "falling back on __name__ and __path__")

    def setUp(self):
        db.create_all()
        create_project_model(save=True)
        create_application_model(save=True)
        create_model_model(save=True)
        create_service_model(save=True)
        create_user_model(user_id=TEST_USER_ID_1, auth_id=TEST_AUTH_ID_1, user_name='TEST USER', save=True)
        create_user_model(user_id=TEST_USER_ID_2, auth_id=TEST_AUTH_ID_2, user_name='OTHER USER', save=True)

    def tearDown(self):
        db.session.remove()
        db.drop_all()


def create_project_model(project_id=TEST_PROJECT_ID, save=False) -> ProjectModel:
    display_name = "test-project"
    project_model = ProjectModel(
        project_id=project_id, display_name=display_name)
    project_model_ = ProjectModel.query.filter_by(project_id=project_id).one_or_none()
    if save and project_model_ is None:
        db.session.add(project_model)
        db.session.commit()
        return project_model
    else:
        return project_model_


def create_kubernetes_model(
        project_id=TEST_PROJECT_ID, display_name='test-kubernetes', save=False) -> KubernetesModel:
    config_path = uuid.uuid4().hex
    exposed_host = 'localhost'
    exposed_port = 80
    kubernetes_model = KubernetesModel(
        project_id=project_id, display_name=display_name, config_path=config_path,
        exposed_host=exposed_host, exposed_port=exposed_port)
    kubernetes_model_ = KubernetesModel.query.filter_by(
        project_id=project_id, display_name=display_name).one_or_none()
    if save and kubernetes_model_ is None:
        db.session.add(kubernetes_model)
        db.session.commit()
        return kubernetes_model
    else:
        return kubernetes_model_


def create_data_server_model(
        project_id=TEST_PROJECT_ID, mode=DataServerModeEnum.LOCAL, save=False) -> DataServerModel:
    data_server_model = DataServerModel(project_id=project_id, data_server_mode=mode)
    data_server_model_ = DataServerModel.query.filter_by(project_id=project_id).one_or_none()
    if save and data_server_model_ is None:
        db.session.add(data_server_model)
        db.session.commit()
        return data_server_model
    else:
        return data_server_model_


def create_application_model(
        project_id=TEST_PROJECT_ID, application_id=TEST_APPLICATION_ID, save=False) -> ApplicationModel:
    application_name = 'test-application'
    application_model = ApplicationModel(
        application_id=application_id, application_name=application_name,
        project_id=project_id)
    application_model_ = ApplicationModel.query.filter_by(
        application_name=application_name,
        project_id=project_id).one_or_none()
    if save and application_model_ is None:
        db.session.add(application_model)
        db.session.commit()
        return application_model
    else:
        return application_model_


def create_model_model(
        application_id=TEST_APPLICATION_ID, model_id=TEST_MODEL_ID, file_path="rekcurd-test-model/test.model",
        description="rekcurd-test-model", save=False) -> ModelModel:
    model_model = ModelModel(
        model_id=model_id, application_id=application_id,
        description=description, filepath=file_path)
    model_model_ = ModelModel.query.filter_by(model_id=model_id).one_or_none()
    if save and model_model_ is None:
        db.session.add(model_model)
        db.session.commit()
        return model_model
    else:
        return model_model_


def create_service_model(
        service_id=TEST_SERVICE_ID, application_id=TEST_APPLICATION_ID, model_id=TEST_MODEL_ID,
        display_name='test-service', service_level='development',
        version='v2', host='localhost', port=5000, save=False) -> ServiceModel:
    service_model = ServiceModel(
        service_id=service_id, application_id=application_id,
        display_name=display_name, service_level=service_level,
        version=version, model_id=model_id,
        host=host, port=port)
    service_model_ = ServiceModel.query.filter_by(
        application_id=application_id, display_name=display_name).one_or_none()
    if save and service_model_ is None:
        db.session.add(service_model)
        db.session.commit()
        return service_model
    else:
        return service_model_


def create_eval_model(
        application_id=TEST_APPLICATION_ID, checksum='abcde',
        data_path='my_data_path', save=False) -> EvaluationModel:
    evaluation_model = EvaluationModel(
        checksum=checksum, application_id=application_id, data_path=data_path)
    if save:
        db.session.add(evaluation_model)
        db.session.commit()
    return evaluation_model


def create_eval_result_model(
        evaluation_id, model_id=TEST_MODEL_ID,
        data_path='my_data_path', result='{}', save=False) -> EvaluationResultModel:
    evaluation_result_model = EvaluationResultModel(
        model_id=model_id, data_path=data_path,
        evaluation_id=evaluation_id, result=result)
    if save:
        db.session.add(evaluation_result_model)
        db.session.commit()
    return evaluation_result_model


def create_user_model(user_id, auth_id, user_name, save=False) -> UserModel:
    user_model = UserModel(user_id=user_id, auth_id=auth_id, user_name=user_name)
    user_model_ = UserModel.query.filter_by(auth_id=auth_id).one_or_none()
    if save and user_model_ is None:
        db.session.add(user_model)
        db.session.commit()
        return user_model
    else:
        return user_model_


def create_project_user_role_model(
        project_id, user_id, project_role=ProjectRole.member, save=True) -> ProjectUserRoleModel:
    project_user_role_model = ProjectUserRoleModel(
        project_id=project_id, user_id=user_id, project_role=project_role)
    project_user_role_model_ = ProjectUserRoleModel.query.filter_by(
        project_id=project_id, user_id=user_id).one_or_none()
    if save and project_user_role_model_ is None:
        db.session.add(project_user_role_model)
        db.session.commit()
        return project_user_role_model
    else:
        project_user_role_model_.project_role = project_role
        return project_user_role_model_


def create_application_user_role_model(
        application_id, user_id, application_role=ApplicationRole.viewer, save=True) -> ApplicationUserRoleModel:
    application_user_role_model = ApplicationUserRoleModel(
        application_id=application_id, user_id=user_id, application_role=application_role)
    application_user_role_model_ = ApplicationUserRoleModel.query.filter_by(
        application_id=application_id, user_id=user_id).one_or_none()
    if save and application_user_role_model_ is None:
        db.session.add(application_user_role_model)
        db.session.commit()
        return application_user_role_model
    else:
        application_user_role_model_.application_role = application_role
        return application_user_role_model_
