from flask_restplus import Namespace, fields, Resource, reqparse, inputs

from . import status_model
from rekcurd_dashboard.models import db, DataServerModel, DataServerModeEnum
from rekcurd_dashboard.utils import RekcurdDashboardException
from rekcurd_dashboard.apis import DatetimeToTimestamp


data_server_api_namespace = Namespace('dataservers', description='Data Server API Endpoint.')
success_or_not = data_server_api_namespace.model('Success', status_model)
data_server_model_params = data_server_api_namespace.model('DataServer', {
    'project_id': fields.Integer(
        required=True,
        description='Project ID.'
    ),
    'data_server_mode': fields.String(
        required=True,
        description='Data server mode. [local/ceph_s3/aws_s3]',
    ),
    'ceph_access_key': fields.String(
        required=False,
        description='Ceph S3 API access key.'
    ),
    'ceph_secret_key': fields.String(
        required=False,
        description='Ceph S3 API secret key.'
    ),
    'ceph_host': fields.String(
        required=False,
        description='Ceph S3 API endpoint host name.'
    ),
    'ceph_port': fields.Integer(
        required=False,
        description='Ceph S3 API port number.'
    ),
    'ceph_is_secure': fields.Boolean(
        required=False,
        description='Ceph S3 API is SSL or not.'
    ),
    'ceph_bucket_name': fields.String(
        required=False,
        description='Ceph S3 API bucket name.'
    ),
    'aws_access_key': fields.String(
        required=False,
        description='AWS S3 API access key.'
    ),
    'aws_secret_key': fields.String(
        required=False,
        description='AWS S3 API secret key.'
    ),
    'aws_bucket_name': fields.String(
        required=False,
        description='AWS S3 API bucket name.'
    ),
    'register_date': DatetimeToTimestamp(
        readOnly=True,
        description='Register date.'
    )
})

data_server_parser = reqparse.RequestParser()
data_server_parser.add_argument(
    'data_server_mode', location='form', type=str, required=True,
    choices=('local', 'ceph_s3', 'aws_s3'),
    help='Data server mode. [local/ceph_s3/aws_s3].')
data_server_parser.add_argument(
    'ceph_access_key', location='form', type=str, required=False,
    default='',
    help='Ceph S3 API access key.')
data_server_parser.add_argument(
    'ceph_secret_key', location='form', type=str, required=False,
    default='',
    help='Ceph S3 API secret key.')
data_server_parser.add_argument(
    'ceph_host', location='form', type=str, required=False,
    default='',
    help='Ceph S3 API endpoint host name.')
data_server_parser.add_argument(
    'ceph_port', location='form', type=int, required=False,
    default=80,
    help='Ceph S3 API port number.')
data_server_parser.add_argument(
    'ceph_is_secure', location='form', type=inputs.boolean, required=False,
    default=False,
    help='Ceph S3 API is SSL or not.')
data_server_parser.add_argument(
    'ceph_bucket_name', location='form', type=str, required=False,
    default='',
    help='Ceph S3 API bucket name.')
data_server_parser.add_argument(
    'aws_access_key', location='form', type=str, required=False,
    default='',
    help='AWS S3 API access key.')
data_server_parser.add_argument(
    'aws_secret_key', location='form', type=str, required=False,
    default='',
    help='AWS S3 API secret key.')
data_server_parser.add_argument(
    'aws_bucket_name', location='form', type=str, required=False,
    default='',
    help='AWS S3 API bucket name.')


@data_server_api_namespace.route('/projects/<int:project_id>/data_servers')
class ApiDataServers(Resource):
    @data_server_api_namespace.marshal_with(data_server_model_params)
    def get(self, project_id: int):
        """get_data_servers"""
        return DataServerModel.query.filter_by(project_id=project_id).first_or_404()

    @data_server_api_namespace.marshal_with(success_or_not)
    @data_server_api_namespace.expect(data_server_parser)
    def post(self, project_id: int):
        """add_data_server"""
        args = data_server_parser.parse_args()
        data_server_mode = args['data_server_mode']
        data_server_mode_enum = DataServerModeEnum.to_enum(data_server_mode)
        ceph_access_key = args['ceph_access_key']
        ceph_secret_key = args['ceph_secret_key']
        ceph_host = args['ceph_host']
        ceph_port = args['ceph_port']
        ceph_is_secure = args['ceph_is_secure']
        ceph_bucket_name = args['ceph_bucket_name']
        aws_access_key = args['aws_access_key']
        aws_secret_key = args['aws_secret_key']
        aws_bucket_name = args['aws_bucket_name']
        if data_server_mode_enum == DataServerModeEnum.LOCAL:
            pass
        elif data_server_mode_enum == DataServerModeEnum.CEPH_S3:
            if ceph_access_key and ceph_secret_key and ceph_host and \
                    ceph_port and ceph_is_secure is not None and ceph_bucket_name:
                pass
            else:
                raise RekcurdDashboardException(
                    "Need to set \"ceph_access_key\", \"ceph_secret_key\", \"ceph_host\", \"ceph_port\", "
                    "\"ceph_is_secure\" and \"ceph_bucket_name\"")
        elif data_server_mode_enum == DataServerModeEnum.AWS_S3:
            if aws_bucket_name:
                pass
            else:
                raise RekcurdDashboardException(
                    "Need to set \"aws_bucket_name\"")
        else:
            raise RekcurdDashboardException("Invalid data server mode specified.")

        data_server_model = db.session.query(DataServerModel).filter(
            DataServerModel.project_id == project_id).one_or_none()
        if data_server_model is not None:
            raise RekcurdDashboardException("Data server exists already.")
        data_server_model = DataServerModel(
            project_id=project_id, data_server_mode=data_server_mode_enum,
            ceph_access_key=ceph_access_key, ceph_secret_key=ceph_secret_key,
            ceph_host=ceph_host, ceph_port=ceph_port, ceph_is_secure=ceph_is_secure,
            ceph_bucket_name=ceph_bucket_name, aws_access_key=aws_access_key,
            aws_secret_key=aws_secret_key, aws_bucket_name=aws_bucket_name)
        db.session.add(data_server_model)
        db.session.commit()
        db.session.close()
        return {"status": True, "message": "Success."}

    @data_server_api_namespace.marshal_with(success_or_not)
    @data_server_api_namespace.expect(data_server_parser)
    def patch(self, project_id: int):
        """update_data_server"""
        args = data_server_parser.parse_args()
        data_server_mode = args['data_server_mode']
        data_server_mode_enum = DataServerModeEnum.to_enum(data_server_mode)
        ceph_access_key = args['ceph_access_key']
        ceph_secret_key = args['ceph_secret_key']
        ceph_host = args['ceph_host']
        ceph_port = args['ceph_port']
        ceph_is_secure = args['ceph_is_secure']
        ceph_bucket_name = args['ceph_bucket_name']
        aws_access_key = args['aws_access_key']
        aws_secret_key = args['aws_secret_key']
        aws_bucket_name = args['aws_bucket_name']

        data_server_model: DataServerModel = db.session.query(DataServerModel).filter(
            DataServerModel.project_id == project_id).first_or_404()
        is_updated = False
        if data_server_model.data_server_mode != data_server_mode_enum:
            is_updated = True
            data_server_model.data_server_mode = data_server_mode_enum
        if ceph_access_key is not None:
            is_updated = True
            data_server_model.ceph_access_key = ceph_access_key
        if ceph_secret_key is not None:
            is_updated = True
            data_server_model.ceph_secret_key = ceph_secret_key
        if ceph_host is not None:
            is_updated = True
            data_server_model.ceph_host = ceph_host
        if ceph_port is not None:
            is_updated = True
            data_server_model.ceph_port = ceph_port
        if ceph_is_secure is not None:
            is_updated = True
            data_server_model.ceph_is_secure = ceph_is_secure
        if ceph_bucket_name is not None:
            is_updated = True
            data_server_model.ceph_bucket_name = ceph_bucket_name
        if aws_access_key is not None:
            is_updated = True
            data_server_model.aws_access_key = aws_access_key
        if aws_secret_key is not None:
            is_updated = True
            data_server_model.aws_secret_key = aws_secret_key
        if aws_bucket_name is not None:
            is_updated = True
            data_server_model.aws_bucket_name = aws_bucket_name

        if data_server_mode_enum == DataServerModeEnum.LOCAL:
            pass
        elif data_server_mode_enum == DataServerModeEnum.CEPH_S3:
            if data_server_model.ceph_access_key and data_server_model.ceph_secret_key and \
                    data_server_model.ceph_host and data_server_model.ceph_port and \
                    data_server_model.ceph_is_secure is not None and data_server_model.ceph_bucket_name:
                pass
            else:
                raise RekcurdDashboardException(
                    "Need to set \"ceph_access_key\", \"ceph_secret_key\", \"ceph_host\", \"ceph_port\", "
                    "\"ceph_is_secure\" and \"ceph_bucket_name\"")
        elif data_server_mode_enum == DataServerModeEnum.AWS_S3:
            if data_server_model.aws_bucket_name:
                pass
            else:
                raise RekcurdDashboardException(
                    "Need to set \"aws_bucket_name\"")
        else:
            raise RekcurdDashboardException("Invalid data server mode specified.")

        if is_updated:
            db.session.commit()
        db.session.close()
        return {"status": True, "message": "Success."}

    @data_server_api_namespace.marshal_with(success_or_not)
    def delete(self, project_id: int):
        """delete_data_server"""
        db.session.query(DataServerModel).filter(DataServerModel.project_id == project_id).delete()
        db.session.commit()
        db.session.close()
        return {"status": True, "message": "Success."}
