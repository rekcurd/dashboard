import datetime
from .dao import db
from sqlalchemy import (
    Column, Integer, DateTime,
    String, Text, UniqueConstraint, ForeignKey
)
from sqlalchemy.orm import relationship
from sqlalchemy.orm import backref


class ModelModel(db.Model):
    """
    Model Info
    """
    __tablename__ = 'models'
    __table_args__ = (
        UniqueConstraint('model_id'),
        UniqueConstraint('application_id','filepath'),
        {'mysql_engine': 'InnoDB'}
    )

    model_id = Column(Integer, primary_key=True, autoincrement=True)
    application_id = Column(String, ForeignKey('applications.application_id', ondelete="CASCADE"), nullable=False)
    filepath = Column(String(512), nullable=False)
    description = Column(Text, nullable=False)
    register_date = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    application = relationship(
        'ApplicationModel', innerjoin=True,
        backref=backref("models", cascade="all, delete-orphan", passive_deletes=True))

    @property
    def serialize(self):
        return {
            'model_id': self.model_id,
            'application_id': self.application_id,
            'filepath': self.filepath,
            'description': self.description,
            'register_date': self.register_date.strftime('%Y-%m-%d %H:%M:%S'),
        }
