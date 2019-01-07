# -*- coding: utf-8 -*-


import os

from flask import Flask, render_template
from flask_cors import CORS

try:
    from my_dashboard_logger import logger
except ImportError:
    from drucker_dashboard.logger import logger

from drucker_dashboard.utils import DruckerDashboardConfig
from drucker_dashboard.models import db
from drucker_dashboard.apis import api
from drucker_dashboard.auth import auth


app = Flask(__name__, static_folder='static')


@app.route('/')
@app.route('/applications')
def root_url():
    return render_template('index.html')


def configure_app(flask_app: Flask, db_url: str) -> None:
    flask_app.config['SQLALCHEMY_DATABASE_URI'] = db_url
    flask_app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True
    flask_app.config['DEBUG'] = os.getenv("FLASK_DEBUG", "True")
    flask_app.config['SWAGGER_UI_DOC_EXPANSION'] = 'list'
    flask_app.config['RESTPLUS_VALIDATE'] = True
    flask_app.config['MAX_CONTENT_LENGTH'] = int(os.getenv("FLASK_MAX_CONTENT_LENGTH", "1073741824"))


def initialize_app(flask_app: Flask, config_file: str = "./settings.yml") -> None:
    config = DruckerDashboardConfig(config_file)
    if not os.path.isdir(config.DIR_KUBE_CONFIG):
        os.makedirs(config.DIR_KUBE_CONFIG)
    configure_app(flask_app, config.DB_URL)
    api.init_app(flask_app, dashboard_config=config)
    auth.init_app(flask_app, api, config.AUTH_CONFIG)
    CORS(flask_app)
    db.init_app(flask_app)
    db.create_all(app=flask_app)


def main() -> None:
    initialize_app(app)
    app.run(host='0.0.0.0', port=18080, threaded=True)


if __name__ == '__main__':
    main()
