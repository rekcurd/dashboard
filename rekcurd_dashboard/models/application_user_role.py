import enum
from .dao import db
from sqlalchemy import (
    Column, Integer,
    Enum, String,
    ForeignKey,
    UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.orm import backref


class ApplicationRole(enum.Enum):
    admin = 1
    editor = 2
    viewer = 3


class ApplicationUserRoleModel(db.Model):
    """
    Application-User Role
    """
    __tablename__ = 'application_user_roles'
    __table_args__ = (
        UniqueConstraint('application_id', 'user_id'),
        {'mysql_engine': 'InnoDB'}
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.user_id', ondelete="CASCADE"), nullable=False)
    application_id = Column(String, ForeignKey('applications.application_id', ondelete="CASCADE"), nullable=True)
    application_role = Column(Enum(ApplicationRole), nullable=False, default=ApplicationRole.viewer)

    application = relationship(
        'ApplicationModel', lazy='joined', innerjoin=True,
        backref=backref("application_user_roles", cascade="all, delete-orphan", passive_deletes=True))
    user = relationship(
        'UserModel',
        backref=backref("application_user_roles", cascade="all, delete-orphan", passive_deletes=True))
