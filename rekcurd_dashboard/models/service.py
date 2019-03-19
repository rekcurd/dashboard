import datetime
from .dao import db
from sqlalchemy import (
    Column, Integer, String, DateTime,
    Text, UniqueConstraint, ForeignKey
)
from sqlalchemy.orm import relationship
from sqlalchemy.orm import backref


class ServiceModel(db.Model):
    """
    Services
    """
    __tablename__ = 'services'
    __table_args__ = (
        UniqueConstraint('service_id'),
        UniqueConstraint('application_id', 'display_name'),
        {'mysql_engine': 'InnoDB'}
    )

    service_id = Column(String(32), primary_key=True)
    application_id = Column(String, ForeignKey('applications.application_id', ondelete="CASCADE"), nullable=False)
    display_name = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)
    service_level = Column(String(128), nullable=False)
    version = Column(String(16), nullable=False)
    model_id = Column(Integer, ForeignKey('models.model_id', ondelete="CASCADE"), nullable=False)
    insecure_host = Column(String(512), nullable=False)
    insecure_port = Column(Integer, nullable=False)
    register_date = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    application = relationship(
        'ApplicationModel', innerjoin=True,
        backref=backref("services", cascade="all, delete-orphan", passive_deletes=True))
    model = relationship(
        'ModelModel', innerjoin=True,
        backref=backref("services", cascade="all, delete-orphan", passive_deletes=True))

    @property
    def serialize(self):
        return {
            'service_id': self.service_id,
            'application_id': self.application_id,
            'display_name': self.display_name,
            'description': self.description,
            'service_name': self.service_name,
            'service_level': self.service_level,
            'version': self.version,
            'model_id': self.model_id,
            'insecure_host': self.insecure_host,
            'insecure_port': self.insecure_port,
            'register_date': self.register_date.strftime('%Y-%m-%d %H:%M:%S'),
        }
