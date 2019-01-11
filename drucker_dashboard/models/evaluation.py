import datetime
from .dao import db
from sqlalchemy import (
    Column, Integer, DateTime,
    String, UniqueConstraint
)
from sqlalchemy.orm import relationship


class Evaluation(db.Model):
    """
    Data to be evaluated
    """
    __tablename__ = 'evaluations'
    __table_args__ = (
        UniqueConstraint('evaluation_id'),
        UniqueConstraint('checksum'),
        {'mysql_engine': 'InnoDB'}
    )

    evaluation_id = Column(Integer, primary_key=True, autoincrement=True)
    checksum = Column(String(128), nullable=False)
    application_id = Column(Integer, nullable=False)
    data_path = Column(String(512), nullable=False)
    register_date = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    evaluation_result = relationship('EvaluationResult', backref='evaluations', lazy='select', innerjoin=True)

    @property
    def serialize(self):
        return {
            'evaluation_id': self.evaluation_id,
            'checksum': self.checksum,
            'application_id': self.application_id,
            'data_path': self.data_path,
            'register_date': self.register_date.strftime('%Y-%m-%d %H:%M:%S'),
        }
