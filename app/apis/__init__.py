import traceback
from flask_restplus import Api
from apis.api_kubernetes import kube_info_namespace
from apis.api_application import app_info_namespace
from apis.api_service import srv_info_namespace
from apis.api_model import mdl_info_namespace
from apis.common import logger
from kubernetes.client.rest import ApiException
from models import db


api = Api(
    version='1.0',
    title='Drucker dashboard API',
    description='Drucker dashboard API'
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
