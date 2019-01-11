import datetime
from .dao import db
from sqlalchemy import (
    Column, Integer, String, DateTime,
    UniqueConstraint
)
from sqlalchemy.orm import relationship


class User(db.Model):
    """
    Users
    """
    __tablename__ = 'users'
    __table_args__ = (
        UniqueConstraint('user_id'),
        UniqueConstraint('auth_id'),
        {'mysql_engine': 'InnoDB'}
    )

    user_id = Column(Integer, primary_key=True, autoincrement=True)
    auth_id = Column(String(512), nullable=True)
    user_name = Column(String(512), nullable=False)
    register_date = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    applications = relationship('ApplicationUserRole', lazy='select', innerjoin=True)

    @property
    def serialize(self):
        return {
            'auth_id': self.auth_id,
            'user_name': self.user_name,
            'register_date': self.register_date.strftime('%Y-%m-%d %H:%M:%S')
        }
