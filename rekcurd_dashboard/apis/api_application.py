import uuid

from flask_jwt_simple import get_jwt_identity
from flask_restplus import Namespace, fields, Resource, reqparse

from . import api
from rekcurd_dashboard import RekcurdDashboardClient
from rekcurd_dashboard.models import db, Application, Service, ApplicationUserRole, Role, User
from rekcurd_dashboard.apis import DatetimeToTimestamp


app_info_namespace = Namespace('applications', description='Application Endpoint.')
success_or_not = app_info_namespace.model('Success', {
    'status': fields.Boolean(
        required=True
    ),
    'message': fields.String(
        required=True
    )
})
app_info = app_info_namespace.model('Application', {
    'application_id': fields.Integer(
        readOnly=True,
        description='Application ID.'
    ),
    'application_name': fields.String(
        required=True,
        description='Application name.',
        example='rekcurd-sample'
    ),
    'kubernetes_id': fields.Integer(
        required=False,
        description='Kubernetes cluster ID.'
    ),
    'description': fields.String(
        required=False,
        description='Description.',
        example='This is a sample.'
    ),
    'register_date': DatetimeToTimestamp(
        readOnly=True,
        description='Register date.'
    ),
    'confirm_date': DatetimeToTimestamp(
        readOnly=True,
        description='Existance confirmation date.'
    )
})


@app_info_namespace.route('/')
class ApiApplications(Resource):
    add_worker_parser = reqparse.RequestParser()
    add_worker_parser.add_argument('host', type=str, required=True, location='form')
    add_worker_parser.add_argument('description', type=str, required=False, location='form')

    @app_info_namespace.marshal_list_with(app_info)
    def get(self):
        """get_applications"""
        if api.dashboard_config.IS_ACTIVATE_AUTH:
            user_id = get_jwt_identity()
            uobj = db.session.query(User).filter(User.user_id == user_id).one()
            # applications which don't have users are also accessible
            application_ids = db.session.query(ApplicationUserRole.application_id).distinct().all()
            ids = [application_id for application_id, in application_ids]
            applications = db.session.query(Application).filter(~Application.application_id.in_(ids)).all()
            return [assoc.application for assoc in uobj.applications] + applications
        return Application.query.all()

    @app_info_namespace.marshal_with(success_or_not)
    @app_info_namespace.expect(add_worker_parser)
    def post(self):
        """add_non-kube_worker"""
        args = self.add_worker_parser.parse_args()
        host = args['host']
        display_name = uuid.uuid4().hex
        description = args['description']

        rekcurd_dashboard_application = RekcurdDashboardClient(logger=api.logger, host=host)
        service_info = rekcurd_dashboard_application.run_service_info()
        application_name = service_info["application_name"]
        service_name = service_info["service_name"]
        service_level = service_info["service_level"]

        aobj = db.session.query(Application).filter(
            Application.application_name == application_name,
            Application.kubernetes_id == None).one_or_none()
        if aobj is None:
            aobj = Application(application_name=application_name,
                               description=description)
            db.session.add(aobj)
            db.session.flush()
        if api.dashboard_config.IS_ACTIVATE_AUTH:
            user_id = get_jwt_identity()
            role = db.session.query(ApplicationUserRole).filter(
                ApplicationUserRole.application_id == aobj.application_id,
                ApplicationUserRole.user_id == user_id).one_or_none()
            if role is None:
                roleObj = ApplicationUserRole(
                    application_id=aobj.application_id,
                    user_id=user_id,
                    role=Role.owner.name)
                db.session.add(roleObj)
                db.session.flush()
        sobj = db.session.query(Service).filter(
            Service.service_name == service_name).one_or_none()
        if sobj is None:
            sobj = Service(application_id=aobj.application_id,
                           service_name=service_name,
                           display_name=display_name,
                           service_level=service_level,
                           host=host,
                           description=description)
            db.session.add(sobj)
            db.session.flush()
        response_body = {"status": True, "message": "Success."}
        db.session.commit()
        db.session.close()
        return response_body

@app_info_namespace.route('/<int:application_id>')
class ApiApplications(Resource):
    edit_app_info_parser = reqparse.RequestParser()
    edit_app_info_parser.add_argument('description', type=str, required=True, location='form')

    @app_info_namespace.marshal_with(app_info)
    def get(self, application_id:int):
        """get_application"""
        return Application.query.filter_by(application_id=application_id).first_or_404()

    @app_info_namespace.marshal_with(success_or_not)
    @app_info_namespace.expect(edit_app_info_parser)
    def patch(self, application_id:int):
        """update_application"""
        args = self.edit_app_info_parser.parse_args()
        description = args['description']
        res = db.session.query(Application).filter(Application.application_id == application_id).one()
        res.description = description
        response_body = {"status": True, "message": "Success."}
        db.session.commit()
        db.session.close()
        return response_body
