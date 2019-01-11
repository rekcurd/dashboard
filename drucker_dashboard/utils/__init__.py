# coding: utf-8


import yaml
import os
import json
from drucker_dashboard.protobuf import drucker_pb2

from .hash_util import HashUtil
from .protobuf_util import ProtobufUtil


class DruckerDashboardConfig:
    def __init__(self, config_file: str):
        settings_yaml = os.getenv("DRUCKER_SETTINGS_YAML", config_file)
        config = dict()
        if settings_yaml is not None:
            with open(settings_yaml, 'r') as f:
                config = yaml.load(f)
        self.TEST_MODE = str(os.getenv("DRUCKER_TEST_MODE", config.get("test", "False"))).lower() == 'true'
        self.DRUCKER_GRPC_VERSION = drucker_pb2.DESCRIPTOR.GetOptions().Extensions[drucker_pb2.drucker_grpc_proto_version]
        self.DIR_KUBE_CONFIG = os.getenv('DRUCKER_KUBE_DATADIR', config.get('kube.datadir', 'kube-config'))
        self._DB_MODE = os.getenv('DRUCKER_DB_MODE', config.get('use.db',"sqlite"))
        self._DB_MYSQL_HOST = os.getenv('DRUCKER_DB_MYSQL_HOST', config.get('db.mysql.host',""))
        self._DB_MYSQL_PORT = os.getenv('DRUCKER_DB_MYSQL_PORT', config.get('db.mysql.port',""))
        self._DB_MYSQL_DBNAME = os.getenv('DRUCKER_DB_MYSQL_DBNAME', config.get('db.mysql.dbname',""))
        self._DB_MYSQL_USER = os.getenv('DRUCKER_DB_MYSQL_USER', config.get('db.mysql.user',""))
        self._DB_MYSQL_PASSWORD = os.getenv('DRUCKER_DB_MYSQL_PASSWORD', config.get('db.mysql.password',""))

        if self._DB_MODE == "sqlite":
            db_name = "db.test.sqlite3" if self.TEST_MODE else "db.sqlite3"
            self.DB_URL = f'sqlite:///{db_name}'
        elif self._DB_MODE == "mysql":
            host = self._DB_MYSQL_HOST
            port = self._DB_MYSQL_PORT
            db_name = "test_"+self._DB_MYSQL_DBNAME if self.TEST_MODE else self._DB_MYSQL_DBNAME
            user = self._DB_MYSQL_USER
            password = self._DB_MYSQL_PASSWORD
            self.DB_URL = f'mysql+pymysql://{user}:{password}@{host}:{port}/{db_name}?charset=utf8'
        else:
            self.DB_URL = 'sqlite:///db.test.sqlite3'

        if str(os.getenv('DRUCKER_ACTIVATE_AUTH', 'False')).lower() == 'true':
            self.IS_ACTIVATE_AUTH = True
            self.AUTH_CONFIG = {
                'secret': os.getenv('DRUCKER_LDAP_SECRET'),
                'ldap': {
                    'host': os.getenv('DRUCKER_LDAP_HOST'),
                    'port': os.getenv('DRUCKER_LDAP_PORT'),
                    'bind_dn': os.getenv('DRUCKER_LDAP_BIND_DN'),
                    'bind_password': os.getenv('DRUCKER_LDAP_BIND_PASSWORD'),
                    'search_filter': os.getenv('DRUCKER_LDAP_SEARCH_FILTER'),
                    'search_base_dns': json.loads(os.getenv('DRUCKER_LDAP_SEARCH_BASE_DNS')),
                }
            }
        elif 'auth' in config:
            self.IS_ACTIVATE_AUTH = True
            self.AUTH_CONFIG = config['auth']
        else:
            self.IS_ACTIVATE_AUTH = False
            self.AUTH_CONFIG = None
