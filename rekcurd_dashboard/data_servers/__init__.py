# coding: utf-8


import datetime

from rekcurd_dashboard.models import ApplicationModel, DataServerModel, DataServerModeEnum
from .local_handler import LocalHandler
from .ceph_handler import CephHandler
from .aws_s3_handler import AwsS3Handler


class DataServer(object):
    """DataServer
    Upload/Download files.
    """

    def __get_handler(self, data_server_model: DataServerModel):
        if data_server_model.data_server_mode == DataServerModeEnum.LOCAL:
            return LocalHandler()
        elif data_server_model.data_server_mode == DataServerModeEnum.CEPH_S3:
            return CephHandler()
        elif data_server_model.data_server_mode == DataServerModeEnum.AWS_S3:
            return AwsS3Handler()
        else:
            raise ValueError("Invalid DataServerModeEnum value.")

    def upload_model(
            self, data_server_model: DataServerModel, application_model: ApplicationModel, local_filepath: str) -> str:
        filepath = "{0}/ml-{1:%Y%m%d%H%M%S}.model".format(application_model.application_name, datetime.datetime.utcnow())
        api_handler = self.__get_handler(data_server_model)
        api_handler.upload(data_server_model, filepath, local_filepath)
        return filepath

    def upload_evaluation_data(
            self, data_server_model: DataServerModel, application_model: ApplicationModel, local_filepath: str) -> str:
        filepath = "{0}/eval-{1:%Y%m%d%H%M%S}.txt".format(application_model.application_name, datetime.datetime.utcnow())
        api_handler = self.__get_handler(data_server_model)
        api_handler.upload(data_server_model, filepath, local_filepath)
        return filepath

    def delete_file(self, data_server_model: DataServerModel, filepath: str) -> None:
        api_handler = self.__get_handler(data_server_model)
        api_handler.delete(data_server_model, filepath)
