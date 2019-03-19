import datetime
from .dao import db
from sqlalchemy import (
    Column, Integer, String, DateTime,
    Text, UniqueConstraint, ForeignKey
)
from sqlalchemy.orm import relationship
from sqlalchemy.orm import backref


class KubernetesModel(db.Model):
    """
    Kubernetes Access Info
    """
    __tablename__ = 'kubernetes'
    __table_args__ = (
        UniqueConstraint('kubernetes_id'),
        UniqueConstraint('config_path'),
        UniqueConstraint('display_name'),
        UniqueConstraint('exposed_host', 'exposed_port'),
        {'mysql_engine': 'InnoDB'}
    )

    kubernetes_id = Column(Integer, primary_key=True, autoincrement=True)
    project_id = Column(Integer, ForeignKey('projects.project_id', ondelete="CASCADE"), nullable=False)
    display_name = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)
    config_path = Column(String(512), nullable=False)
    exposed_host = Column(String(512), nullable=False)
    exposed_port = Column(Integer, nullable=False)
    register_date = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    projects = relationship(
        'ProjectModel', innerjoin=True,
        backref=backref("kubernetes", cascade="all, delete-orphan", passive_deletes=True))

    @property
    def serialize(self):
        return {
            'kubernetes_id': self.kubernetes_id,
            'project_id': self.project_id,
            'display_name': self.display_name,
            'description': self.description,
            'config_path': self.config_path,
            'exposed_host': self.exposed_host,
            'exposed_port': self.exposed_port,
            'register_date': self.register_date.strftime('%Y-%m-%d %H:%M:%S'),
        }
