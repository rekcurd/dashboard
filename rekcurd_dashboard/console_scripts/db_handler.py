# -*- coding: utf-8 -*-


from rekcurd_dashboard.core import create_app


def db_handler(args: dict):
    import sys
    from flask_script import Manager
    from flask_migrate import Migrate, MigrateCommand
    from rekcurd_dashboard.models import db

    tmp = sys.argv[1:]
    sys.argv = [sys.argv[0]]
    for i, t in enumerate(tmp):
        if t == 'db':
            sys.argv.append(t)
            sys.argv.append(tmp[i+1])
            break
    app, _ = create_app(config_file=args["settings"], logger_file=args["logger"], **args)
    migrate = Migrate(app, db)
    manager = Manager(app)
    manager.add_command('db', MigrateCommand)
    manager.run()
