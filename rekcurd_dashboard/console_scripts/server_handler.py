# -*- coding: utf-8 -*-


from rekcurd_dashboard.core import create_app


def server_handler(args):
    app = create_app(args.settings, args.logger)
    app.run(host=args.host, port=args.port, threaded=True)
