#!/usr/bin/python
# -*- coding: utf-8 -*-

import yaml, os
import drucker_pb2


TEST_MODE = False if os.getenv("DRUCKER_TEST_MODE", None) is None else True

BASE_PATH = os.path.abspath(os.path.dirname(__file__))
SETTINGS_YAML = os.getenv("DRUCKER_DASHBOARD_SETTINGS_YAML",
                          os.path.join(BASE_PATH, "..", "settings.yml"))
config = yaml.load(open(SETTINGS_YAML, 'r'))

DRUCKER_GRPC_VERSION = drucker_pb2.DESCRIPTOR.GetOptions().Extensions[drucker_pb2.drucker_grpc_proto_version]

DIR_KUBE_CONFIG = os.getenv('DRUCKER_KUBE_DATADIR', config.get('kube.datadir', 'kube-config'))

DB_MODE = os.getenv('DRUCKER_DB_MODE', config.get('use.db',"sqlite"))
DB_MYSQL_HOST = os.getenv('DRUCKER_DB_MYSQL_HOST', config.get('db.mysql.host',""))
DB_MYSQL_PORT = os.getenv('DRUCKER_DB_MYSQL_PORT', config.get('db.mysql.port',""))
DB_MYSQL_DBNAME = os.getenv('DRUCKER_DB_MYSQL_DBNAME', config.get('db.mysql.dbname',""))
DB_MYSQL_USER = os.getenv('DRUCKER_DB_MYSQL_USER', config.get('db.mysql.user',""))
DB_MYSQL_PASSWORD = os.getenv('DRUCKER_DB_MYSQL_PASSWORD', config.get('db.mysql.password',""))
