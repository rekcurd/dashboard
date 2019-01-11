import datetime
from .dao import db
from sqlalchemy import (
    Column, Integer, DateTime, Text,
    UniqueConstraint, ForeignKey, String
)


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
    model_id = Column(Integer, nullable=False)
    data_path = Column(String(512), nullable=False)
    evaluation_id = Column(Integer, ForeignKey('evaluations.evaluation_id'), nullable=False)
    result = Column(Text, nullable=False)
    register_date = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    @property
    def serialize(self):
        return {
            'evaluation_result_id': self.evaluation_result_id,
            'model_id': self.model_id,
            'data_path': self.data_path,
            'evaluation_id': self.evaluation_id,
            'result': self.result,
            'register_date': self.register_date.strftime('%Y-%m-%d %H:%M:%S'),
        }
