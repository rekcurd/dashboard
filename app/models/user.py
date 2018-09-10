import datetime
from sqlalchemy import (
    Column, Integer, String, DateTime,
    UniqueConstraint
)
from sqlalchemy.orm import relationship
from models import db


class User(db.Model):
    """
    Users
    """
    __tablename__ = 'users'
    __table_args__ = (
        UniqueConstraint('user_id'),
        UniqueConstraint('user_uid'),
        {'mysql_engine': 'InnoDB'}
    )

    user_id = Column(Integer, primary_key=True, autoincrement=True)
    user_uid = Column(String(512), nullable=True)
    user_name = Column(String(512), nullable=False)
    register_date = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    applications = relationship('ApplicationUserRole', lazy='joined', innerjoin=True)

    @property
    def serialize(self):
        return {
            'user_id': self.user_id,
            'user_uid': self.user_uid,
            'user_name': self.user_name,
            'register_date': self.register_date.strftime('%Y-%m-%d %H:%M:%S')
        }
