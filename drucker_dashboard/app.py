# -*- coding: utf-8 -*-


import argparse

from drucker_dashboard import _version
from drucker_dashboard.server import create_app


def server_handler(args):
    app = create_app(args.settings, args.logger)
    app.run(host=args.host, port=args.port, threaded=True)


def db_handler(args):
    import sys
    from flask_script import Manager
    from flask_migrate import Migrate, MigrateCommand
    from drucker_dashboard.models import db

    tmp = sys.argv[1:]
    sys.argv = [sys.argv[0]]
    for i, t in enumerate(tmp):
        if t == 'db':
            sys.argv.append(t)
            sys.argv.append(tmp[i+1])
            break
    app = create_app(args.settings, args.logger)
    migrate = Migrate(app, db)
    manager = Manager(app)
    manager.add_command('db', MigrateCommand)
    manager.run()


def create_parser():
    parser = argparse.ArgumentParser(description='rekcurdui command')
    parser.add_argument(
        '--version', '-v', action='version', version=_version.__version__)
    parser.add_argument(
        '--settings', required=True, help='settings YAML. See https://github.com/rekcurd/drucker-dashboard/blob/master/drucker_dashboard/settings.yml')
    parser.add_argument(
        '--logger', required=False, help='Python file of your custom logger. Need to inherit "logger_interface.py". See https://github.com/rekcurd/drucker-dashboard/blob/master/drucker_dashboard/logger/logger_interface.py', default=None)
    subparsers = parser.add_subparsers()

    # server
    parser_server = subparsers.add_parser(
        'server', help='see `rekcurdui server -h`')
    parser_server.add_argument(
        '-H', '--host', required=False, help='host', default='0.0.0.0')
    parser_server.add_argument(
        '-p', '--port', required=False, type=int, help='port', default=18080)
    parser_server.set_defaults(handler=server_handler)

    # db
    parser_db = subparsers.add_parser(
        'db', help='see `rekcurdui db -h`')
    parser_db.add_argument(
        'type', choices=['init', 'revision', 'migrate', 'edit', 'merge',
                         'upgrade', 'downgrade', 'show', 'history', 'heads',
                         'branches', 'current', 'stamp'])
    parser_db.set_defaults(handler=db_handler)

    return parser


def main() -> None:
    parser = create_parser()
    args = parser.parse_args()

    if hasattr(args, 'handler'):
        args.handler(args)
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
