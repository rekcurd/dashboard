#!/usr/bin/python
# -*- coding: utf-8 -*-

from abc import ABCMeta, abstractmethod

class SystemLoggerInterface(metaclass=ABCMeta):
    @abstractmethod
    def exception(self, message:str) -> None:
        raise NotImplemented()

    @abstractmethod
    def error(self, message:str) -> None:
        raise NotImplemented()

    @abstractmethod
    def debug(self, message:str) -> None:
        raise NotImplemented()

    @abstractmethod
    def info(self, message:str) -> None:
        raise NotImplemented()

    @abstractmethod
    def warn(self, message:str) -> None:
        raise NotImplemented()
