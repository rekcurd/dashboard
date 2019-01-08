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


def create_app(config_file: str = "settings.yml"):
    """create_app."""

    app = Flask(__name__, static_folder='static')

    @app.route('/')
    @app.route('/login')
    @app.route('/settings/kubernetes/hosts')
    @app.route('/settings/kubernetes/hosts/add')
    @app.route('/settings/kubernetes/hosts/<int:kubernetes_id>/edit')
    @app.route('/applications')
    @app.route('/applications/add')
    @app.route('/applications/<int:application_id>/dashboard')
    @app.route('/applications/<int:application_id>/services')
    @app.route('/applications/<int:application_id>/services/add')
    @app.route('/applications/<int:application_id>/services/<int:service_id>/edit')
    @app.route('/applications/<int:application_id>/models')
    @app.route('/applications/<int:application_id>/models/<int:model_id>/edit')
    @app.route('/applications/<int:application_id>/admin')
    def root_url(**kwargs):
        return render_template('index.html')

    # load configurations
    config = DruckerDashboardConfig(config_file)
    if not os.path.isdir(config.DIR_KUBE_CONFIG):
        os.makedirs(config.DIR_KUBE_CONFIG)

    # set configurations
    app.config['SQLALCHEMY_DATABASE_URI'] = config.DB_URL
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True
    app.config['DEBUG'] = os.getenv("FLASK_DEBUG", "True")
    app.config['SWAGGER_UI_DOC_EXPANSION'] = 'list'
    app.config['RESTPLUS_VALIDATE'] = True
    app.config['MAX_CONTENT_LENGTH'] = int(os.getenv("FLASK_MAX_CONTENT_LENGTH", "1073741824"))

    # initialize applications
    api.init_app(app, dashboard_config=config)
    auth.init_app(app, api, config.AUTH_CONFIG)
    CORS(app)
    db.init_app(app)
    db.create_all(app=app)

    return app


def main() -> None:
    app = create_app()
    app.run(host='0.0.0.0', port=18080, threaded=True)


if __name__ == '__main__':
    main()
