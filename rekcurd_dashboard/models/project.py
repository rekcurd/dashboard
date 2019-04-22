import datetime
from .dao import db
from sqlalchemy import (
    Column, Integer, String, DateTime,
    Boolean, Text, UniqueConstraint
)


class ProjectModel(db.Model):
    """
    Project Info
    """
    __tablename__ = 'projects'
    __table_args__ = (
        UniqueConstraint('project_id'),
        UniqueConstraint('display_name'),
        {'mysql_engine': 'InnoDB'}
    )

    project_id = Column(Integer, primary_key=True, autoincrement=True)
    display_name = Column(String(128), nullable=False)
    use_kubernetes = Column(Boolean, nullable=False, default=False)
    description = Column(Text, nullable=True)
    register_date = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    @property
    def serialize(self):
        return {
            'project_id': self.project_id,
            'display_name': self.display_name,
            'use_kubernetes': self.use_kubernetes,
            'register_date': self.register_date.strftime('%Y-%m-%d %H:%M:%S'),
            'description': self.description,
        }
