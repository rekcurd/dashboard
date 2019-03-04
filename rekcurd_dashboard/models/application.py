import datetime
from .dao import db

from sqlalchemy import (
    Column, Integer, String,
    Text, DateTime, UniqueConstraint, ForeignKey
)
from sqlalchemy.orm import relationship
from sqlalchemy.orm import backref


class ApplicationModel(db.Model):
    """
    Applications
    """
    __tablename__ = 'applications'
    __table_args__ = (
        UniqueConstraint('application_id'),
        UniqueConstraint('project_id', 'application_name'),
        {'mysql_engine': 'InnoDB'}
    )

    application_id = Column(String(32), primary_key=True)
    project_id = Column(Integer, ForeignKey('projects.project_id', ondelete="CASCADE"), nullable=False)
    application_name = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)
    register_date = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    projects = relationship(
        'ProjectModel', innerjoin=True,
        backref=backref("applications", cascade="all, delete-orphan", passive_deletes=True))

    @property
    def serialize(self):
        return {
            'application_id': self.application_id,
            'application_name': self.application_name,
            'project_id': self.project_id,
            'description': self.description,
            'register_date': self.register_date.strftime('%Y-%m-%d %H:%M:%S'),
        }
