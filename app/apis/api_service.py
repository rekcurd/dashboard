import datetime

from werkzeug.datastructures import FileStorage

from flask_restplus import Namespace, fields, Resource, reqparse

from app import logger
from models import db, Kubernetes, Application, Service, Evaluation
from core.drucker_dashboard_client import DruckerDashboardClient

from apis.common import DatetimeToTimestamp
from apis.api_kubernetes import update_dbs_kubernetes, switch_drucker_service_model_assignment


srv_info_namespace = Namespace('services', description='Service Endpoint.')
success_or_not = srv_info_namespace.model('Success', {
    'status': fields.Boolean(
        required=True
    ),
    'message': fields.String(
        required=True
    )
})
srv_info = srv_info_namespace.model('Service', {
    'service_id': fields.Integer(
        readOnly=True,
        description='Service ID.'
    ),
    'service_name': fields.String(
        required=True,
        description='Service tag.',
        example='drucker-sample-development-123456789'
    ),
    'display_name': fields.String(
        required=True,
        description='Display name.',
        example='dev-001'
    ),
    'application_id': fields.Integer(
        readOnly=True,
        description='Application ID.'
    ),
    'model_id': fields.Integer(
        readOnly=True,
        description='Model ID.'
    ),
    'service_level': fields.String(
        required=True,
        description='Service level. [development/beta/staging/sandbox/production]',
        example='development'
    ),
    'register_date': DatetimeToTimestamp(
        readOnly=True,
        description='Register date.'
    ),
    'confirm_date': DatetimeToTimestamp(
        readOnly=True,
        description='Existance confirmation date.'
    ),
    'update_date': DatetimeToTimestamp(
        readOnly=True,
        description='Update date.'
    ),
    'host': fields.String(
        required=False,
        description='host.',
        example='drucker-sample.example.com'
    ),
    'description': fields.String(
        required=False,
        description='Description.',
        example='This is a sample.'
    )
})


@srv_info_namespace.route('/<int:application_id>/services')
class ApiApplicationIdServices(Resource):
    @srv_info_namespace.marshal_list_with(srv_info)
    def get(self, application_id:int):
        """get_services"""
        return Service.query.filter_by(application_id=application_id).all()

@srv_info_namespace.route('/<int:application_id>/services/<int:service_id>')
class ApiApplicationIdServiceId(Resource):
    switch_model_parser = reqparse.RequestParser()
    switch_model_parser.add_argument('model_id', type=int, required=True, location='form')

    update_config_parser = reqparse.RequestParser()
    update_config_parser.add_argument('display_name', type=str, required=True, location='form')
    update_config_parser.add_argument('description', type=str, required=False, location='form')

    @srv_info_namespace.marshal_with(srv_info)
    def get(self, application_id:int, service_id:int):
        """get_service"""
        return Service.query.filter_by(
            application_id=application_id,
            service_id=service_id).first_or_404()

    @srv_info_namespace.marshal_with(success_or_not)
    @srv_info_namespace.expect(switch_model_parser)
    def put(self, application_id:int, service_id:int):
        """switch_service_model_assignment"""
        args = self.switch_model_parser.parse_args()
        model_id = args['model_id']
        response_body = switch_drucker_service_model_assignment(
            application_id, service_id, model_id)
        db.session.commit()
        db.session.close()
        return response_body

    @srv_info_namespace.marshal_with(success_or_not)
    @srv_info_namespace.expect(update_config_parser)
    def patch(self, application_id:int, service_id:int):
        """update_service_config"""
        args = self.update_config_parser.parse_args()
        display_name = args['display_name']
        description = args['description']

        sobj = db.session.query(Service).filter(
            Service.application_id == application_id,
            Service.service_id == service_id).one()
        sobj.display_name = display_name
        if description is not None:
            sobj.description = description
        sobj.update_date = datetime.datetime.utcnow()
        response_body = {"status": True, "message": "Success."}
        db.session.commit()
        db.session.close()
        return response_body

    @srv_info_namespace.marshal_with(success_or_not)
    def delete(self, application_id:int, service_id:int):
        """delete_service"""
        aobj = db.session.query(Application).filter(
            Application.application_id == application_id).one_or_none()
        if aobj is None:
            raise Exception("No such application_id.")
        sobj = db.session.query(Service).filter(
            Service.application_id == application_id,
            Service.service_id == service_id).one_or_none()
        if sobj is None:
            raise Exception("No such service_id.")

        if aobj.kubernetes_id is None:
            db.session.query(Service).filter(
                Service.application_id == application_id,
                Service.service_id == service_id).delete()
            db.session.flush()
        else:
            kubernetes_id = aobj.kubernetes_id
            kobj = db.session.query(Kubernetes).filter(
                Kubernetes.kubernetes_id == kubernetes_id).one_or_none()
            if kobj is None:
                raise Exception("No such kubernetes_id.")
            config_path = kobj.config_path
            from kubernetes import client, config
            config.load_kube_config(config_path)

            apps_v1 = client.AppsV1Api()
            v1_deployment = apps_v1.delete_namespaced_deployment(
                name="{0}-deployment".format(sobj.service_name),
                namespace=sobj.service_level,
                body=client.V1DeleteOptions()
            )
            core_vi = client.CoreV1Api()
            v1_service = core_vi.delete_namespaced_service(
                name="{0}-service".format(sobj.service_name),
                namespace=sobj.service_level,
                #body=client.V1DeleteOptions() #FIXME add this after v6.0.0
            )
            extensions_v1_beta = client.ExtensionsV1beta1Api()
            v1_beta1_ingress = extensions_v1_beta.delete_namespaced_ingress(
                name="{0}-ingress".format(sobj.service_name),
                namespace=sobj.service_level,
                body=client.V1DeleteOptions()
            )
            autoscaling_v1 = client.AutoscalingV1Api()
            v1_horizontal_pod_autoscaler = autoscaling_v1.delete_namespaced_horizontal_pod_autoscaler(
                name="{0}-autoscaling".format(sobj.service_name),
                namespace=sobj.service_level,
                body=client.V1DeleteOptions()
            )
            applist = set((aobj.application_name,))
            update_dbs_kubernetes(kubernetes_id, applist)
        response_body = {"status": True, "message": "Success."}
        db.session.commit()
        db.session.close()
        return response_body

@srv_info_namespace.route('/<int:application_id>/services/<int:service_id>/evaluate')
class ApiEvaluate(Resource):
    upload_parser = reqparse.RequestParser()
    upload_parser.add_argument('file', location='files', type=FileStorage, required=True)

    @srv_info_namespace.expect(upload_parser)
    def post(self, application_id:int, service_id:int):
        """evaluate"""
        args = self.upload_parser.parse_args()
        file = args['file']
        eval_data_path = "eval-{0:%Y%m%d%H%M%S}".format(datetime.datetime.utcnow())

        sobj = Service.query.filter_by(
            application_id=application_id,
            service_id=service_id).first_or_404()

        drucker_dashboard_application = DruckerDashboardClient(logger=logger, host=sobj.host)
        response_body = drucker_dashboard_application.run_evaluate_model(file, eval_data_path)

        if response_body['num'] != 0:
            eobj = Evaluation(service_id=service_id, data_path=eval_data_path)
            db.session.add(eobj)
            db.session.commit()
            db.session.close()

        return response_body
