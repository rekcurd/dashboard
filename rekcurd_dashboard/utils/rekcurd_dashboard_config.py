# coding: utf-8


import yaml
import os
import json
from rekcurd_dashboard.protobuf import rekcurd_pb2


class RekcurdDashboardConfig:
    """
    Rekcurd dashboard configurations.
    """
    __SERVICE_DEFAULT_PORT: int = 18080
    REKCURD_GRPC_VERSION: str = rekcurd_pb2.DESCRIPTOR.GetOptions().Extensions[rekcurd_pb2.rekcurd_grpc_proto_version]

    __TEST_MODE: bool = None
    KUBERNETES_MODE: str = None
    DEBUG_MODE: bool = None
    SERVICE_PORT: int = __SERVICE_DEFAULT_PORT
    DIR_KUBE_CONFIG: str = None
    SQLALCHEMY_DATABASE_URI: str = None
    IS_ACTIVATE_AUTH: bool = None
    AUTH_CONFIG: dict = None

    def __init__(self, config_file: str = None):
        self.__TEST_MODE = os.getenv("DASHBOARD_TEST_MODE", "False").lower() == 'true'
        self.KUBERNETES_MODE = os.getenv("DASHBOARD_KUBERNETES_MODE")
        if self.KUBERNETES_MODE is None:
            self.__load_from_file(config_file)
        else:
            self.__load_from_env()

    def set_configurations(
            self, debug_mode: bool = None, port: int = None,
            kube_config_dir: str = None,
            db_mode: str = None, db_host: str = None, db_port: int = None,
            db_name: str = None, db_username: str = None, db_password: str = None,
            **options):
        self.DEBUG_MODE = debug_mode if debug_mode is not None else self.DEBUG_MODE
        self.SERVICE_PORT = int(port or self.SERVICE_PORT)
        self.DIR_KUBE_CONFIG = kube_config_dir or self.DIR_KUBE_CONFIG
        self.SQLALCHEMY_DATABASE_URI = \
            self.__create_db_uri(db_mode, db_host, db_port, db_name, db_username, db_password) or \
            self.SQLALCHEMY_DATABASE_URI
        # TODO: Auth

    def __load_from_file(self, config_file: str):
        if config_file is not None:
            with open(config_file, 'r') as f:
                config = yaml.load(f)
        else:
            config = dict()
        self.DEBUG_MODE = config.get("debug", False)
        self.SERVICE_PORT = config.get("port", self.SERVICE_PORT)
        self.DIR_KUBE_CONFIG = config.get("kube_config_dir", "kube-config")
        config_db = config.get("db", dict())
        db_mode = config_db.get("mode", "sqlite")
        config_db_mysql = config_db.get("mysql", dict())
        db_host = config_db_mysql.get("host")
        db_port = config_db_mysql.get("port")
        db_name = config_db_mysql.get("dbname")
        db_username = config_db_mysql.get("username")
        db_password = config_db_mysql.get("password")
        self.SQLALCHEMY_DATABASE_URI = \
            self.__create_db_uri(db_mode, db_host, db_port, db_name, db_username, db_password)
        if 'auth' in config:
            self.IS_ACTIVATE_AUTH = True
            self.AUTH_CONFIG = config['auth']
        else:
            self.IS_ACTIVATE_AUTH = False
            self.AUTH_CONFIG = None

    def __load_from_env(self):
        self.DEBUG_MODE = os.getenv("DASHBOARD_DEBUG_MODE", "False").lower() == 'true'
        self.SERVICE_PORT = int(os.getenv("DASHBOARD_SERVICE_PORT", "{}".format(self.__SERVICE_DEFAULT_PORT)))
        self.DIR_KUBE_CONFIG = os.getenv("DASHBOARD_KUBE_DATADIR")
        db_mode = os.getenv('DASHBOARD_DB_MODE')
        db_host = os.getenv('DASHBOARD_DB_MYSQL_HOST')
        db_port = os.getenv('DASHBOARD_DB_MYSQL_PORT')
        db_name = os.getenv('DASHBOARD_DB_MYSQL_DBNAME')
        db_username = os.getenv('DASHBOARD_DB_MYSQL_USERNAME')
        db_password = os.getenv('DASHBOARD_DB_MYSQL_PASSWORD')
        self.SQLALCHEMY_DATABASE_URI = \
            self.__create_db_uri(db_mode, db_host, db_port, db_name, db_username, db_password)
        if os.getenv('DASHBOARD_IS_AUTH', 'False').lower() == 'true':
            self.IS_ACTIVATE_AUTH = True
            self.AUTH_CONFIG = {
                'secret': os.getenv('DASHBOARD_LDAP_SECRET'),
                'ldap': {
                    'host': os.getenv('DASHBOARD_LDAP_HOST'),
                    'port': os.getenv('DASHBOARD_LDAP_PORT'),
                    'bind_dn': os.getenv('DASHBOARD_LDAP_BIND_DN'),
                    'bind_password': os.getenv('DASHBOARD_LDAP_BIND_PASSWORD'),
                    'search_filter': os.getenv('DASHBOARD_LDAP_SEARCH_FILTER'),
                    'search_base_dns': json.loads(os.getenv('DASHBOARD_LDAP_SEARCH_BASE_DNS')),
                }
            }
        else:
            self.IS_ACTIVATE_AUTH = False
            self.AUTH_CONFIG = None

    def __create_db_uri(self, db_mode, db_host, db_port, db_name, db_username, db_password):
        if self.__TEST_MODE:
            from sqlalchemy.engine import Engine
            from sqlalchemy import event

            @event.listens_for(Engine, "connect")
            def set_sqlite_pragma(dbapi_connection, connection_record):
                cursor = dbapi_connection.cursor()
                cursor.execute("PRAGMA foreign_keys=ON")
                cursor.close()
            return f'sqlite:///db.test.sqlite3'
        elif db_mode is None:
            return None
        elif db_mode == "sqlite":
            from sqlalchemy.engine import Engine
            from sqlalchemy import event

            @event.listens_for(Engine, "connect")
            def set_sqlite_pragma(dbapi_connection, connection_record):
                cursor = dbapi_connection.cursor()
                cursor.execute("PRAGMA foreign_keys=ON")
                cursor.close()
            return f'sqlite:///db.sqlite3'
        elif db_mode == "mysql" and db_host and db_port and db_name and db_username and db_password:
            return f'mysql+pymysql://{db_username}:{db_password}@{db_host}:{db_port}/{db_name}?charset=utf8'
        else:
            raise TypeError("Invalid DB configurations.")
