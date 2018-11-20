import datetime
from sqlalchemy import (
    Column, Integer, DateTime,
    String, UniqueConstraint
)

from models import db


class Evaluation(db.Model):
    """
    Evaluation Info
    """
    __tablename__ = 'evaluations'
    __table_args__ = (
        UniqueConstraint('evaluation_id'),
        {'mysql_engine': 'InnoDB'}
    )

    evaluation_id = Column(Integer, primary_key=True, autoincrement=True)
    service_id = Column(Integer, nullable=False)
    data_path = Column(String(512), nullable=False)
    register_date = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    @property
    def serialize(self):
        return {
            'evaluation_id': self.evaluation_id,
            'service_id': self.service_id,
            'data_path': self.data_path,
            'register_date': self.register_date.strftime('%Y-%m-%d %H:%M:%S'),
        }
