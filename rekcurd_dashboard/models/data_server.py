import datetime
import enum
from .dao import db
from sqlalchemy import (
    Column, Integer, String, DateTime, Enum,
    Boolean, UniqueConstraint, ForeignKey
)
from sqlalchemy.orm import relationship
from sqlalchemy.orm import backref


class DataServerModeEnum(enum.Enum):
    """
    Rekcurd data server options.
    """
    LOCAL = 'local'
    CEPH_S3 = 'ceph_s3'
    AWS_S3 = 'aws_s3'
    GCS = 'gcs'
    PV = 'pv'  # Need to set env as 'local' for Rekcurd worker

    @classmethod
    def to_enum(cls, mode: str):
        if cls.LOCAL.value == mode:
            return cls.LOCAL
        elif cls.CEPH_S3.value == mode:
            return cls.CEPH_S3
        elif cls.AWS_S3.value == mode:
            return cls.AWS_S3
        elif cls.GCS.value == mode:
            return cls.GCS
        elif cls.PV.value == mode:
            return cls.PV
        else:
            raise ValueError("'{}' is not supported as ModelModeEnum".format(mode))


class DataServerModel(db.Model):
    """
    Data Server Info
    """
    __tablename__ = 'data_servers'
    __table_args__ = (
        UniqueConstraint('project_id'),
        {'mysql_engine': 'InnoDB'}
    )

    project_id = Column(Integer, ForeignKey('projects.project_id', ondelete="CASCADE"), primary_key=True)
    data_server_mode = Column(Enum(DataServerModeEnum), nullable=False, default=DataServerModeEnum.LOCAL)
    ceph_access_key = Column(String(128), nullable=False, default='')
    ceph_secret_key = Column(String(128), nullable=False, default='')
    ceph_host = Column(String(512), nullable=False, default='')
    ceph_port = Column(Integer, nullable=False, default=80)
    ceph_is_secure = Column(Boolean, nullable=False, default=False)
    ceph_bucket_name = Column(String(128), nullable=False, default='')
    aws_access_key = Column(String(128), nullable=False, default='')
    aws_secret_key = Column(String(128), nullable=False, default='')
    aws_bucket_name = Column(String(128), nullable=False, default='')
    # TODO: GCP
    # TODO: PV
    register_date = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)

    project = relationship(
        'ProjectModel', innerjoin=True,
        backref=backref("data_servers", cascade="all, delete-orphan", passive_deletes=True))
