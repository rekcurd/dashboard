import datetime
from sqlalchemy import (
    Column, Integer, DateTime,
    UniqueConstraint, ForeignKey, String
)

from models import db


class EvaluationResult(db.Model):
    """
    Evaluation Info
    """
    __tablename__ = 'evaluation_results'
    __table_args__ = (
        UniqueConstraint('evaluation_result_id'),
        {'mysql_engine': 'InnoDB'}
    )

    evaluation_result_id = Column(Integer, primary_key=True, autoincrement=True)
    service_id = Column(Integer, nullable=False)
    data_path = Column(String(512), nullable=False)
    evaluation_id = Column(Integer, ForeignKey('evaluations.evaluation_id'), nullable=False)
    register_date = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    @property
    def serialize(self):
        return {
            'evaluation_result_id': self.evaluation_result_id,
            'service_id': self.service_id,
            'data_path': self.data_path,
            'evaluation_id': self.evaluation_id,
            'register_date': self.register_date.strftime('%Y-%m-%d %H:%M:%S'),
        }
