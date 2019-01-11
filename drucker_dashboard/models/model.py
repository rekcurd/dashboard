import datetime
from .dao import db
from sqlalchemy import (
    Column, Integer, DateTime,
    String, Text, UniqueConstraint
)


class Model(db.Model):
    """
    Model Info
    """
    __tablename__ = 'models'
    __table_args__ = (
        UniqueConstraint('model_id'),
        UniqueConstraint('application_id','model_path'),
        {'mysql_engine': 'InnoDB'}
    )

    model_id = Column(Integer, primary_key=True, autoincrement=True)
    application_id = Column(Integer, nullable=False)
    model_path = Column(String(512), nullable=False)
    description = Column(Text, nullable=True)
    register_date = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    @property
    def serialize(self):
        return {
            'model_id': self.model_id,
            'application_id': self.application_id,
            'model_path': self.model_path,
            'description': self.description,
            'register_date': self.register_date.strftime('%Y-%m-%d %H:%M:%S'),
        }
