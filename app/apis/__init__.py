import traceback
from flask_restplus import Api
from app import logger
from apis.api_kubernetes import kube_info_namespace
from apis.api_application import app_info_namespace
from apis.api_service import srv_info_namespace
from apis.api_model import mdl_info_namespace
from apis.api_evaluation import eval_info_namespace
from apis.api_misc import misc_info_namespace
from apis.api_admin import admin_info_namespace
from auth import auth_required
from kubernetes.client.rest import ApiException
from models import db

api = Api(
    version='1.0',
    title='Drucker dashboard API',
    description='Drucker dashboard API',
    decorators=[auth_required]
)


@api.errorhandler(ApiException)
def api_exception_handler(error):
    logger.error(str(error))
    logger.error(traceback.format_exc())
    return {'message': str(error)}, 400


@api.errorhandler
def default_error_handler(error):
    """:TODO: Use an appropriate error code."""
    logger.error(str(error))
    logger.error(traceback.format_exc())
    db.session.rollback()
    db.session.close()
    return {'message': str(error)}, 500


api.add_namespace(kube_info_namespace, path='/api/kubernetes')
api.add_namespace(app_info_namespace, path='/api/applications')
api.add_namespace(srv_info_namespace, path='/api/applications')
api.add_namespace(mdl_info_namespace, path='/api/applications')
api.add_namespace(eval_info_namespace, path='/api/applications')
api.add_namespace(admin_info_namespace, path='/api/applications')
api.add_namespace(misc_info_namespace, path='/api')
