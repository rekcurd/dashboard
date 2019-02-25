import datetime
import json
from .dao import db
from sqlalchemy import (
    Column, Integer, DateTime, Text,
    UniqueConstraint, ForeignKey, String
)
from sqlalchemy.orm import relationship
from sqlalchemy.orm import backref


class EvaluationResultModel(db.Model):
    """
    Evaluation Info
    """
    __tablename__ = 'evaluation_results'
    __table_args__ = (
        UniqueConstraint('evaluation_result_id'),
        {'mysql_engine': 'InnoDB'}
    )

    evaluation_result_id = Column(Integer, primary_key=True, autoincrement=True)
    model_id = Column(Integer, ForeignKey('models.model_id', ondelete="CASCADE"), nullable=False)
    data_path = Column(String(512), nullable=False)
    evaluation_id = Column(Integer, ForeignKey('evaluations.evaluation_id', ondelete="CASCADE"), nullable=False)
    _result = Column(Text, nullable=False)
    register_date = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    model = relationship(
        'ModelModel', innerjoin=True,
        backref=backref("evaluation_results", cascade="all, delete-orphan", passive_deletes=True))
    evaluations = relationship(
        'EvaluationModel', lazy='select', innerjoin=True,
        backref=backref("evaluation_results", cascade="all, delete-orphan", passive_deletes=True))

    @property
    def result(self):
        res = json.loads(self._result)
        res['result_id'] = self.evaluation_result_id
        return res

    @result.setter
    def result(self, value):
        if isinstance(value, dict):
            res = json.dumps(value)
        else:
            res = value
        self._result = res

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
