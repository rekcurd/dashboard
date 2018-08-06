#!/usr/bin/python
# -*- coding: utf-8 -*-

import yaml, os
import drucker_pb2


BASE_PATH = os.path.abspath(os.path.dirname(__file__))
config = yaml.load(open(os.path.join(BASE_PATH, "..", "settings.yml"), 'r'))

DRUCKER_GRPC_VERSION = drucker_pb2.EnumVersionInfo.Name(int(drucker_pb2.EnumVersionInfo.Name(0).replace('idx_','')))

DIR_KUBE_CONFIG = "kube-config"

DB_MODE = os.getenv('DRUCKER_DB_MODE', config.get('use.db',"sqlite"))
DB_MYSQL_HOST = os.getenv('DRUCKER_DB_MYSQL_HOST', config.get('db.mysql.host',""))
DB_MYSQL_PORT = os.getenv('DRUCKER_DB_MYSQL_PORT', config.get('db.mysql.port',""))
DB_MYSQL_DBNAME = os.getenv('DRUCKER_DB_MYSQL_DBNAME', config.get('db.mysql.dbname',""))
DB_MYSQL_USER = os.getenv('DRUCKER_DB_MYSQL_USER', config.get('db.mysql.user',""))
DB_MYSQL_PASSWORD = os.getenv('DRUCKER_DB_MYSQL_PASSWORD', config.get('db.mysql.password',""))
