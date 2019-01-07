import datetime
from .dao import db

from sqlalchemy import (
    Column, Integer, String,
    Text, DateTime, UniqueConstraint
)


class Application(db.Model):
    """
    Applications
    """
    __tablename__ = 'applications'
    __table_args__ = (
        UniqueConstraint('application_id'),
        {'mysql_engine': 'InnoDB'}
    )

    application_id = Column(Integer, primary_key=True, autoincrement=True)
    application_name = Column(String(128), nullable=False)
    kubernetes_id = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)
    register_date = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    confirm_date = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    @property
    def serialize(self):
        return {
            'application_id': self.application_id,
            'application_name': self.application_name,
            'kubernetes_id': self.kubernetes_id,
            'description': self.description,
            'register_date': self.register_date.strftime('%Y-%m-%d %H:%M:%S'),
            'confirm_date': self.confirm_date.strftime('%Y-%m-%d %H:%M:%S'),
        }
