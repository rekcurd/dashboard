# coding: utf-8


from abc import ABCMeta, abstractmethod
from pathlib import Path

from rekcurd_dashboard.models import DataServerModel


def convert_to_valid_path(filepath: str) -> Path:
    """
    Remove a root path prefix "/", and a relative path "." and "..".
    :param filepath:
    :return:
    """
    valid_factors = [factor for factor in filepath.split("/") if factor and factor != ".."]
    return Path(*valid_factors)


class DataHandler(metaclass=ABCMeta):
    """Interface class.
    """

    @abstractmethod
    def download(self, data_server_model: DataServerModel, remote_filepath: str, local_filepath: str) -> None:
        raise NotImplemented()

    @abstractmethod
    def upload(self, data_server_model: DataServerModel, remote_filepath: str, local_filepath: str) -> None:
        raise NotImplemented()

    @abstractmethod
    def delete(self, data_server_model: DataServerModel, filepath: str) -> None:
        raise NotImplemented()
