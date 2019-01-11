# -*- coding: utf-8 -*-


import os
import types

from flask import Flask, render_template
from flask_cors import CORS

from drucker_dashboard.utils import DruckerDashboardConfig
from drucker_dashboard.models import db
from drucker_dashboard.apis import api
from drucker_dashboard.auth import auth


def create_app(config_file: str = "settings.yml", logger_file: str = None):
    """create_app."""

    app = Flask(__name__, static_folder='static', template_folder='static/dist')
    app.logger.disabled = True
    for h in app.logger.handlers[:]:
        app.logger.removeHandler(h)

    @app.route('/')
    @app.route('/<path:path>')
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

    # logger
    try:
        l = types.ModuleType('logger')
        with open(logger_file, mode='rb') as f:
            exec(compile(f.read(), logger_file, 'exec'), l.__dict__)
        logger = l.__dict__.get("logger")
        logger.info("Use custom logger.")
    except Exception as e:
        from drucker_dashboard.logger import logger
        logger.info(str(e))
        logger.info("Invalid logger.")
        logger.info("Use default logger.")

    # initialize applications
    api.init_app(app, dashboard_config=config, logger=logger)
    auth.init_app(app, api, config.AUTH_CONFIG, logger=logger)
    CORS(app)
    db.init_app(app)
    db.create_all(app=app)

    return app


def main() -> None:
    app = create_app()
    app.run(host='0.0.0.0', port=18080, threaded=True)


if __name__ == '__main__':
    main()
