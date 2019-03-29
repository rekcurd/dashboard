# coding: utf-8


import boto3

from rekcurd_dashboard.models import DataServerModel
from .data_handler import DataHandler


class AwsS3Handler(DataHandler):
    """AwsS3Handler
    """
    def _initialize(self, data_server_model: DataServerModel):
        resource = boto3.resource(
            's3',
            aws_access_key_id=data_server_model.aws_access_key,
            aws_secret_access_key=data_server_model.aws_secret_key,
        )
        bucket_name = data_server_model.aws_bucket_name
        return resource, bucket_name

    def download(self, data_server_model: DataServerModel, remote_filepath: str, local_filepath: str) -> None:
        resource, bucket_name = self._initialize(data_server_model)
        resource.Bucket(bucket_name).download_file(remote_filepath, local_filepath)

    def upload(self, data_server_model: DataServerModel, remote_filepath: str, local_filepath: str) -> None:
        resource, bucket_name = self._initialize(data_server_model)
        resource.Bucket(bucket_name).upload_file(local_filepath, remote_filepath)

    def delete(self, data_server_model: DataServerModel, filepath: str) -> None:
        resource, bucket_name = self._initialize(data_server_model)
        resource.Object(bucket_name, filepath).delete()
