import enum
from .dao import db
from sqlalchemy import (
    Column, Integer,
    Enum,
    ForeignKey,
    UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.orm import backref


class ProjectRole(enum.Enum):
    admin = 1
    member = 2


class ProjectUserRoleModel(db.Model):
    """
    Project-User Role
    """
    __tablename__ = 'project_user_roles'
    __table_args__ = (
        UniqueConstraint('project_id', 'user_id'),
        {'mysql_engine': 'InnoDB'}
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.user_id', ondelete="CASCADE"), nullable=False)
    project_id = Column(Integer, ForeignKey('projects.project_id', ondelete="CASCADE"), nullable=False)
    project_role = Column(Enum(ProjectRole), nullable=False)

    project = relationship(
        'ProjectModel', lazy='joined', innerjoin=True,
        backref=backref("project_user_roles", cascade="all, delete-orphan", passive_deletes=True))
    user = relationship(
        'UserModel',
        backref=backref("project_user_roles", cascade="all, delete-orphan", passive_deletes=True))
