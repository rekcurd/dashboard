# -*- coding: utf-8 -*-


import argparse

from rekcurd_dashboard import _version

from .server_handler import server_handler
from .db_handler import db_handler


def create_parser():
    parser = argparse.ArgumentParser(description='rekcurd_dashboard command')
    parser.add_argument(
        '--version', '-v', action='version', version=_version.__version__)
    parser.add_argument(
        '--settings', required=True, help='settings YAML. See https://github.com/rekcurd/dashboard/blob/master/rekcurd_dashboard/settings.yml')
    parser.add_argument(
        '--logger', required=False, help='Python file of your custom logger. Need to inherit "logger_interface.py". See https://github.com/rekcurd/dashboard/blob/master/rekcurd_dashboard/logger/logger_interface.py', default=None)
    subparsers = parser.add_subparsers()

    # server
    parser_server = subparsers.add_parser(
        'server', help='see `rekcurd_dashboard server -h`')
    parser_server.add_argument(
        '-H', '--host', required=False, help='host', default='0.0.0.0')
    parser_server.add_argument(
        '-p', '--port', required=False, type=int, help='port', default=18080)
    parser_server.set_defaults(handler=server_handler)

    # db
    parser_db = subparsers.add_parser(
        'db', help='see `rekcurd_dashboard db -h`')
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
