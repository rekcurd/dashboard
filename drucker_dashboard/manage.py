#!/usr/bin/python
# -*- coding: utf-8 -*-
from flask import Flask
from flask_script import Manager
from flask_migrate import Migrate, MigrateCommand

from app import initialize_app
from models import db


app = Flask(__name__)
initialize_app(app)
migrate = Migrate(app, db)
manager = Manager(app)
manager.add_command('db', MigrateCommand)

if __name__ == '__main__':
    manager.run()
