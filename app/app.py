#!/usr/bin/python
# -*- coding: utf-8 -*-
#
# DO NOT EDIT HERE!!
import os

from flask import Flask, jsonify
from flask_cors import CORS

from models import db, db_url
from apis import api
from auth import auth
from utils.env_loader import DIR_KUBE_CONFIG, config

app = Flask(__name__)


def configure_app(flask_app: Flask) -> None:
    flask_app.config['SQLALCHEMY_DATABASE_URI'] = db_url()
    flask_app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True
    flask_app.config['DEBUG'] = bool(os.getenv("FLASK_DEBUG", "True"))
    flask_app.config['SWAGGER_UI_DOC_EXPANSION'] = 'list'
    flask_app.config['RESTPLUS_VALIDATE'] = True


def initialize_app(flask_app: Flask) -> None:
    if not os.path.isdir(DIR_KUBE_CONFIG):
        os.mkdir(DIR_KUBE_CONFIG)
    configure_app(flask_app)

    api.init_app(flask_app)
    if 'auth' in config:
        auth.init_app(flask_app, api)

    CORS(app)

    db.init_app(flask_app)
    db.create_all(app=flask_app)


def main() -> None:
    initialize_app(app)
    app.run(host='0.0.0.0', port=18080, threaded=True)


if __name__ == '__main__':
    main()
