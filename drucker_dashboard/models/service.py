import datetime
from .dao import db
from sqlalchemy import (
    Column, Integer, String, DateTime,
    Text, UniqueConstraint
)


class Service(db.Model):
    """
    Services
    """
    __tablename__ = 'services'
    __table_args__ = (
        UniqueConstraint('service_id'),
        UniqueConstraint('service_name'),
        UniqueConstraint('application_id','display_name'),
        {'mysql_engine': 'InnoDB'}
    )

    service_id = Column(Integer, primary_key=True, autoincrement=True)
    service_name = Column(String(512), nullable=False)
    display_name = Column(String(128), nullable=False)
    application_id = Column(Integer, nullable=False)
    model_id = Column(Integer, nullable=True)
    service_level = Column(String(128), nullable=False)
    register_date = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    confirm_date = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    update_date = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    host = Column(String(512), nullable=False)
    description = Column(Text, nullable=True)

    @property
    def serialize(self):
        return {
            'service_id': self.service_id,
            'service_name': self.service_name,
            'display_name': self.display_name,
            'application_id': self.application_id,
            'model_id': self.model_id,
            'service_level': self.service_level,
            'register_date': self.register_date.strftime('%Y-%m-%d %H:%M:%S'),
            'confirm_date': self.confirm_date.strftime('%Y-%m-%d %H:%M:%S'),
            'update_date': self.update_date.strftime('%Y-%m-%d %H:%M:%S'),
            'host': self.host,
            'description': self.description,
        }
