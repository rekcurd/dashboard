# -*- coding: utf-8 -*-


import types

from flask import Flask, render_template
from flask_cors import CORS
from pathlib import Path

from rekcurd_dashboard.utils import RekcurdDashboardConfig
from rekcurd_dashboard.models import db
from rekcurd_dashboard.apis import api
from rekcurd_dashboard.auth import auth


def create_app(config_file: str = None, logger_file: str = None, **options) -> (Flask, RekcurdDashboardConfig):
    """create_app."""

    app = Flask(__name__, static_folder='static', template_folder='static/dist')
    app.logger.disabled = True
    for h in app.logger.handlers[:]:
        app.logger.removeHandler(h)

    @app.route('/ui/')
    @app.route('/ui/<path:path>')
    def root_url(**kwargs):
        return render_template('index.html')

    # load configurations
    config = RekcurdDashboardConfig(config_file)
    config.set_configurations(**options)
    kubedir = Path(config.DIR_KUBE_CONFIG)
    if not kubedir.exists():
        kubedir.mkdir(parents=True, exist_ok=True)

    # set configurations
    app.config['SQLALCHEMY_DATABASE_URI'] = config.SQLALCHEMY_DATABASE_URI
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True
    app.config['DEBUG'] = config.DEBUG_MODE
    app.config['SWAGGER_UI_DOC_EXPANSION'] = 'list'
    app.config['RESTPLUS_VALIDATE'] = True
    app.config['MAX_CONTENT_LENGTH'] = 1073741824

    # logger
    try:
        l = types.ModuleType('logger')
        with open(logger_file, mode='rb') as f:
            exec(compile(f.read(), logger_file, 'exec'), l.__dict__)
        logger = l.__dict__.get("logger")
        logger.info("Use custom logger.")
    except Exception as e:
        from rekcurd_dashboard.logger import logger
        logger.info(str(e))
        logger.info("Invalid logger.")
        logger.info("Use default logger.")

    # initialize applications
    api.init_app(app, dashboard_config=config, logger=logger)
    auth.init_app(app, api, config.AUTH_CONFIG, logger=logger)
    CORS(app)
    db.init_app(app)
    db.create_all(app=app)

    return app, config


def main(args) -> None:
    app, config = create_app(*args[1:])
    app.run(host='0.0.0.0', port=config.SERVICE_PORT, threaded=True)


if __name__ == '__main__':
    import sys
    main(sys.argv)
