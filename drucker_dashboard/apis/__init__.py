# coding: utf-8


import traceback

from flask_restplus import Api
from flask_restplus.utils import default_id
from kubernetes.client.rest import ApiException

from drucker_dashboard.auth import auth_required
from drucker_dashboard.models import db


class DruckerDashboardApi(Api):
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
                         catch_all_404s=catch_all_404s, serve_challenge_on_401=serve_challenge_on_401, format_checker=format_checker,
                         **kwargs)
        self.dashboard_config = None
        self.logger = None

    def init_app(self, app, **kwargs):
        super().init_app(app, **kwargs)
        self.dashboard_config = kwargs.get('dashboard_config')
        self.logger = kwargs.get('logger')


api = DruckerDashboardApi(
    version='1.0',
    title='Drucker dashboard API',
    description='Drucker dashboard API',
    doc='/doc/',
    decorators=[auth_required]
)


from .common import DatetimeToTimestamp, kubernetes_cpu_to_float
from .api_kubernetes import kube_info_namespace
from .api_application import app_info_namespace
from .api_service import srv_info_namespace
from .api_model import mdl_info_namespace
from .api_misc import misc_info_namespace
from .api_admin import admin_info_namespace


@api.errorhandler(ApiException)
def api_exception_handler(error):
    api.logger.error(str(error))
    api.logger.error(traceback.format_exc())
    return {'message': str(error)}, 400


@api.errorhandler
def default_error_handler(error):
    """:TODO: Use an appropriate error code."""
    api.logger.error(str(error))
    api.logger.error(traceback.format_exc())
    db.session.rollback()
    db.session.close()
    return {'message': str(error)}, 500


api.add_namespace(kube_info_namespace, path='/api/kubernetes')
api.add_namespace(app_info_namespace, path='/api/applications')
api.add_namespace(srv_info_namespace, path='/api/applications')
api.add_namespace(mdl_info_namespace, path='/api/applications')
api.add_namespace(admin_info_namespace, path='/api/applications')
api.add_namespace(misc_info_namespace, path='/api')
