# coding: utf-8


import datetime

from rekcurd_dashboard.models import ApplicationModel, DataServerModel, DataServerModeEnum
from .data_handler import DataHandler, convert_to_valid_path
from .local_handler import LocalHandler
from .ceph_handler import CephHandler
from .aws_s3_handler import AwsS3Handler


class DataServer(object):
    """DataServer
    Upload/Download files.
    """

    # Suffix for evaluation results
    __EVALUATE_RESULT = '_eval_res.pkl'
    __EVALUATE_DETAIL = '_eval_detail.pkl'

    def upload_model(
            self, data_server_model: DataServerModel, application_model: ApplicationModel, local_filepath: str) -> str:
        filepath = "{0}/ml-{1:%Y%m%d%H%M%S}.model".format(application_model.application_name, datetime.datetime.utcnow())
        if data_server_model.data_server_mode == DataServerModeEnum.LOCAL:
            api_handler = LocalHandler()
        elif data_server_model.data_server_mode == DataServerModeEnum.CEPH_S3:
            api_handler = CephHandler()
        elif data_server_model.data_server_mode == DataServerModeEnum.AWS_S3:
            api_handler = AwsS3Handler()
        else:
            raise ValueError("Invalid DataServerModeEnum value.")

        api_handler.upload(data_server_model, filepath, local_filepath)
        return filepath
