# coding: utf-8
from rekcurd_dashboard.models import DataServerModel
from .data_handler import DataHandler


class LocalHandler(DataHandler):
    """LocalHandler
    This does nothing because dashboard passes requests to Rekcurd service in LOCAL mode
    """

    def download(self, data_server_model: DataServerModel, remote_filepath: str, local_filepath: str) -> None:
        pass

    def upload(self, data_server_model: DataServerModel, remote_filepath: str, local_filepath: str) -> None:
        pass

    def delete(self, data_server_model: DataServerModel, filepath: str) -> None:
        pass
