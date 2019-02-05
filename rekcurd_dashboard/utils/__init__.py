# coding: utf-8


import yaml
import os
import json
from rekcurd_dashboard.protobuf import rekcurd_pb2

from .hash_util import HashUtil
from .protobuf_util import ProtobufUtil


class RekcurdDashboardConfig:
    def __init__(self, config_file: str):
        settings_yaml = os.getenv("REKCURD_SETTINGS_YAML", config_file)
        config = dict()
        if settings_yaml is not None:
            with open(settings_yaml, 'r') as f:
                config = yaml.load(f)
        self.TEST_MODE = str(os.getenv("REKCURD_TEST_MODE", config.get("test", "False"))).lower() == 'true'
        self.REKCURD_GRPC_VERSION = rekcurd_pb2.DESCRIPTOR.GetOptions().Extensions[rekcurd_pb2.rekcurd_grpc_proto_version]
        self.DIR_KUBE_CONFIG = os.getenv('REKCURD_KUBE_DATADIR', config.get('kube.datadir', 'kube-config'))
        self._DB_MODE = os.getenv('REKCURD_DB_MODE', config.get('use.db',"sqlite"))
        self._DB_MYSQL_HOST = os.getenv('REKCURD_DB_MYSQL_HOST', config.get('db.mysql.host',""))
        self._DB_MYSQL_PORT = os.getenv('REKCURD_DB_MYSQL_PORT', config.get('db.mysql.port',""))
        self._DB_MYSQL_DBNAME = os.getenv('REKCURD_DB_MYSQL_DBNAME', config.get('db.mysql.dbname',""))
        self._DB_MYSQL_USER = os.getenv('REKCURD_DB_MYSQL_USER', config.get('db.mysql.user',""))
        self._DB_MYSQL_PASSWORD = os.getenv('REKCURD_DB_MYSQL_PASSWORD', config.get('db.mysql.password',""))

        if self._DB_MODE == "sqlite":
            db_name = "db.test.sqlite3" if self.TEST_MODE else "db.sqlite3"
            self.DB_URL = f'sqlite:///{db_name}'
            from sqlalchemy.engine import Engine
            from sqlalchemy import event
            @event.listens_for(Engine, "connect")
            def set_sqlite_pragma(dbapi_connection, connection_record):
                cursor = dbapi_connection.cursor()
                cursor.execute("PRAGMA foreign_keys=ON")
                cursor.close()
        elif self._DB_MODE == "mysql":
            host = self._DB_MYSQL_HOST
            port = self._DB_MYSQL_PORT
            db_name = "test_"+self._DB_MYSQL_DBNAME if self.TEST_MODE else self._DB_MYSQL_DBNAME
            user = self._DB_MYSQL_USER
            password = self._DB_MYSQL_PASSWORD
            self.DB_URL = f'mysql+pymysql://{user}:{password}@{host}:{port}/{db_name}?charset=utf8'
        else:
            self.DB_URL = 'sqlite:///db.test.sqlite3'

        if str(os.getenv('REKCURD_ACTIVATE_AUTH', 'False')).lower() == 'true':
            self.IS_ACTIVATE_AUTH = True
            self.AUTH_CONFIG = {
                'secret': os.getenv('REKCURD_LDAP_SECRET'),
                'ldap': {
                    'host': os.getenv('REKCURD_LDAP_HOST'),
                    'port': os.getenv('REKCURD_LDAP_PORT'),
                    'bind_dn': os.getenv('REKCURD_LDAP_BIND_DN'),
                    'bind_password': os.getenv('REKCURD_LDAP_BIND_PASSWORD'),
                    'search_filter': os.getenv('REKCURD_LDAP_SEARCH_FILTER'),
                    'search_base_dns': json.loads(os.getenv('REKCURD_LDAP_SEARCH_BASE_DNS')),
                }
            }
        elif 'auth' in config:
            self.IS_ACTIVATE_AUTH = True
            self.AUTH_CONFIG = config['auth']
        else:
            self.IS_ACTIVATE_AUTH = False
            self.AUTH_CONFIG = None
