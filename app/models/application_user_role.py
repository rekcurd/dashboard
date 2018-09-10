import enum
from models import db
from sqlalchemy import (
    Column, Integer,
    Enum,
    ForeignKey,
)
from sqlalchemy.orm import relationship


class Role(enum.Enum):
    view = 1
    edit = 2
    admin = 3


class ApplicationUserRole(db.Model):
    """
    Application-User Role
    """
    __tablename__ = 'application_user_roles'
    __table_args__ = (
        {'mysql_engine': 'InnoDB'}
    )

    application_id = Column(Integer, ForeignKey('applications.application_id'), primary_key=True)
    user_id = Column(Integer, ForeignKey('users.user_id'), primary_key=True)
    role = Column(Enum(Role), nullable=False, default=Role.view)

    application = relationship('Application', lazy='joined', innerjoin=True)
