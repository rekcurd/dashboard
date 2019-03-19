# -*- coding: utf-8 -*-


from rekcurd_dashboard.core import create_app


def server_handler(args: dict):
    app, config = create_app(config_file=args["settings"], logger_file=args["logger"], **args)
    app.run(host=args["host"], port=config.SERVICE_PORT, threaded=True)
