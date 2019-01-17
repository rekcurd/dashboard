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


class Role(enum.Enum):
    viewer = 1
    editor = 2
    owner = 3


class ApplicationUserRole(db.Model):
    """
    Application-User Role
    """
    __tablename__ = 'application_user_roles'
    __table_args__ = (
        UniqueConstraint('application_id', 'user_id'),
        {'mysql_engine': 'InnoDB'}
    )

    application_id = Column(Integer, ForeignKey('applications.application_id', ondelete="CASCADE"), primary_key=True)
    user_id = Column(Integer, ForeignKey('users.user_id', ondelete="CASCADE"), primary_key=True)
    role = Column(Enum(Role), nullable=False, default=Role.viewer)

    application = relationship('Application', lazy='joined', innerjoin=True,
                               backref=backref("application_user_roles", cascade="all, delete-orphan"))
    user = relationship('User',
                        backref=backref("application_user_roles", cascade="all, delete-orphan"))
