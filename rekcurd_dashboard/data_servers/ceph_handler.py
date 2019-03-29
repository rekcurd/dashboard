# coding: utf-8


import boto
import boto.s3.connection

from rekcurd_dashboard.models import DataServerModel
from .data_handler import DataHandler


class CephHandler(DataHandler):
    """CephHandler
    """
    def _initialize(self, data_server_model: DataServerModel) -> (boto.s3.connection.S3Connection, str):
        conn = boto.connect_s3(
            aws_access_key_id=data_server_model.ceph_access_key,
            aws_secret_access_key=data_server_model.ceph_secret_key,
            host=data_server_model.ceph_host,
            port=data_server_model.ceph_port,
            is_secure=data_server_model.ceph_is_secure,
            calling_format=boto.s3.connection.OrdinaryCallingFormat())
        bucket_name = data_server_model.ceph_bucket_name
        return conn, bucket_name

    def download(self, data_server_model: DataServerModel, remote_filepath: str, local_filepath: str) -> None:
        conn, bucket_name = self._initialize(data_server_model)
        bucket = conn.get_bucket(bucket_name)
        key = bucket.get_key(remote_filepath)
        key.get_contents_to_filename(local_filepath)

    def upload(self, data_server_model: DataServerModel, remote_filepath: str, local_filepath: str) -> None:
        conn, bucket_name = self._initialize(data_server_model)
        bucket = conn.get_bucket(bucket_name)
        key = bucket.new_key(remote_filepath)
        key.set_contents_from_filename(local_filepath, replace=False)

    def delete(self, data_server_model: DataServerModel, filepath: str) -> None:
        conn, bucket_name = self._initialize(data_server_model)
        bucket = conn.get_bucket(bucket_name)
        bucket.delete_key(filepath)
