# coding: utf-8


import traceback

from flask_restplus import Api
from flask_restplus.utils import default_id
from werkzeug.exceptions import HTTPException
from kubernetes.client.rest import ApiException

from rekcurd_dashboard.utils import RekcurdDashboardException, ProjectUserRoleException, ApplicationUserRoleException
from rekcurd_dashboard.auth import auth_required
from rekcurd_dashboard.models import db


class RekcurdDashboardApi(Api):
    def __init__(self, app=None, version='1.0', title=None, description=None,
                 terms_url=None, license=None, license_url=None,
                 contact=None, contact_url=None, contact_email=None,
                 authorizations=None, security=None, doc='/', default_id=default_id,
                 default='default', default_label='Default namespace', validate=None,
                 tags=None, prefix='', ordered=False,
                 default_mediatype='application/json', decorators=None,
                 catch_all_404s=False, serve_challenge_on_401=False, format_checker=None,
                 **kwargs):
        super().__init__(app=app, version=version, title=title, description=description,
                         terms_url=terms_url, license=license, license_url=license_url,
                         contact=contact, contact_url=contact_url, contact_email=contact_email,
                         authorizations=authorizations, security=security, doc=doc, default_id=default_id,
                         default=default, default_label=default_label, validate=validate,
                         tags=tags, prefix=prefix, ordered=ordered,
                         default_mediatype=default_mediatype, decorators=decorators,
                         catch_all_404s=catch_all_404s, serve_challenge_on_401=serve_challenge_on_401,
                         format_checker=format_checker,
                         **kwargs)
        self.dashboard_config = None
        self.logger = None

    def init_app(self, app, **kwargs):
        super().init_app(app, **kwargs)
        self.dashboard_config = kwargs.get('dashboard_config')
        self.logger = kwargs.get('logger')


api = RekcurdDashboardApi(
    version='1.0',
    title='Rekcurd dashboard API',
    description='Rekcurd dashboard API',
    doc='/doc/',
    decorators=[auth_required]
)


from .common import DatetimeToTimestamp, kubernetes_cpu_to_float, status_model
from .kubernetes_handler import (
    get_full_config_path, save_kubernetes_access_file, remove_kubernetes_access_file,
    update_kubernetes_deployment_info, apply_rekcurd_to_kubernetes, load_kubernetes_deployment_info,
    switch_model_assignment, backup_kubernetes_deployment, delete_kubernetes_deployment,
    backup_istio_routing, load_istio_routing, apply_new_route_weight
)
from .api_admin import admin_api_namespace
from .api_project import project_api_namespace
from .api_data_server import data_server_api_namespace
from .api_kubernetes import kubernetes_api_namespace
from .api_application import application_api_namespace
from .api_service import service_api_namespace
from .api_model import model_api_namespace
from .api_service_deployment import service_deployment_api_namespace
from .api_service_routing import service_routing_api_namespace
from .api_evaluation import evaluation_api_namespace
from .api_misc import misc_api_namespace


@api.errorhandler(ApiException)
def api_exception_handler(error):
    api.logger.error(str(error))
    api.logger.error(traceback.format_exc())
    return {'status': False, 'message': 'Something wrong with accessing Kubernetes'}, 400


@api.errorhandler(RekcurdDashboardException)
@api.errorhandler(ProjectUserRoleException)
@api.errorhandler(ApplicationUserRoleException)
def rekcurd_exception_handler(error):
    api.logger.error(str(error))
    api.logger.error(traceback.format_exc())
    db.session.rollback()
    db.session.close()
    return {'status': False, 'message': str(error)}, 400


@api.errorhandler
def default_error_handler(error):
    api.logger.error(str(error))
    api.logger.error(traceback.format_exc())
    db.session.rollback()
    db.session.close()
    return {'status': False, 'message': 'Something wrong. Contact the admin.'}, 500


api.add_namespace(admin_api_namespace, path='/api')
api.add_namespace(project_api_namespace, path='/api')
api.add_namespace(data_server_api_namespace, path='/api')
api.add_namespace(kubernetes_api_namespace, path='/api')
api.add_namespace(application_api_namespace, path='/api')
api.add_namespace(service_api_namespace, path='/api')
api.add_namespace(model_api_namespace, path='/api')
api.add_namespace(service_deployment_api_namespace, path='/api')
api.add_namespace(service_routing_api_namespace, path='/api')
api.add_namespace(evaluation_api_namespace, path='/api')
api.add_namespace(misc_api_namespace, path='/api')
