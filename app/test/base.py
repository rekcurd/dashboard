from flask import Flask
from flask_testing import TestCase

from models import db, Application, Service
from app import initialize_app


class BaseTestCase(TestCase):
    START_TIMEOUT = 180
    SQLALCHEMY_DATABASE_URI = "sqlite://"
    TESTING = True

    def create_app(self):
        app = Flask(__name__)
        initialize_app(app)
        return app

    @classmethod
    def setUpClass(cls):
        app = Flask(__name__)
        initialize_app(app)

    def setUp(self):
        db.create_all()
        aobj = create_app_obj(save=True)
        create_service_obj(aobj.application_id, save=True)

    def tearDown(self):
        db.session.remove()
        db.drop_all()


def create_app_obj(kubernetes_id=1, save=False):
    app_name = 'drucker-test-app'
    aobj = Application(application_name=app_name, kubernetes_id=kubernetes_id)
    aobj_ = Application.query.filter_by(
        application_name=app_name,
        kubernetes_id=kubernetes_id).one_or_none()
    if save and aobj_ is None:
        db.session.add(aobj)
        db.session.commit()
        return aobj
    else:
        return aobj_


def create_service_obj(
        application_id,
        service_name='drucker-test-app-development-20180628151929',
        service_level='development',
        host='localhost:5000',
        save=False):
    sobj = Service(application_id=application_id,
                   service_name=service_name,
                   service_level=service_level,
                   host=host,
                   display_name=service_name)
    sobj_ = Service.query.filter_by(
        service_name=service_name).one_or_none()
    if save and sobj_ is None:
        db.session.add(sobj)
        db.session.commit()
        return sobj
    else:
        return sobj_
