import datetime
from .dao import db
from sqlalchemy import (
    Column, Integer, String, DateTime,
    Text, UniqueConstraint
)


class Kubernetes(db.Model):
    """
    Kubernetes Info
    """
    __tablename__ = 'kubernetes'
    __table_args__ = (
        UniqueConstraint('kubernetes_id'),
        UniqueConstraint('config_path'),
        UniqueConstraint('dns_name'),
        UniqueConstraint('display_name'),
        {'mysql_engine': 'InnoDB'}
    )

    kubernetes_id = Column(Integer, primary_key=True, autoincrement=True)
    config_path = Column(String(512), nullable=False)
    dns_name = Column(String(512), nullable=False)
    display_name = Column(String(128), nullable=False)
    db_mysql_host = Column(String(128), nullable=False)
    db_mysql_port = Column(String(128), nullable=False)
    db_mysql_dbname = Column(String(128), nullable=False)
    db_mysql_user = Column(String(128), nullable=False)
    db_mysql_password = Column(String(128), nullable=False)
    host_model_dir = Column(String(128), nullable=False)
    pod_model_dir = Column(String(128), nullable=False)
    register_date = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    description = Column(Text, nullable=True)

    @property
    def serialize(self):
        return {
            'kubernetes_id': self.kubernetes_id,
            'config_path': self.config_path,
            'dns_name': self.dns_name,
            'display_name': self.display_name,
            'db_mysql_host': self.db_mysql_host,
            'db_mysql_port': self.db_mysql_port,
            'db_mysql_dbname': self.db_mysql_dbname,
            'db_mysql_user': self.db_mysql_user,
            'db_mysql_password': self.db_mysql_password,
            'host_model_dir': self.host_model_dir,
            'pod_model_dir': self.pod_model_dir,
            'register_date': self.register_date.strftime('%Y-%m-%d %H:%M:%S'),
            'description': self.description,
        }
