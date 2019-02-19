#!/usr/bin/python
# -*- coding: utf-8 -*-

import sys
import logging
from socket import gethostname
from fluent import handler
from .logger_interface import SystemLoggerInterface


class FluentSystemLogger(SystemLoggerInterface):

    def __init__(self, logger_name:str='rekcurd_dashboard', log_level:int=logging.NOTSET) -> None:
        """
        constructor
        :param logger_name: logger name
        :param log_level:
        """
        super().__init__()
        self.log = logging.getLogger(logger_name)
        self.log.setLevel(log_level)

        custom_format = {
            'host': gethostname(),
            'short_message': '%(message)s',
            'timestamp': '%(created)d.%(msecs)d',
            'level': '%(loglevel)d'
        }

        fluent_handler = handler.FluentHandler('rekcurd_dashboard')
        formatter = handler.FluentRecordFormatter(custom_format)
        fluent_handler.setFormatter(formatter)
        fluent_handler.setLevel(log_level)
        self.log.handlers = []
        self.log.addHandler(fluent_handler)

    def exception(self, message:str) -> None:
        """
        emmits exception to log
        :param message: error message
        """
        self.log.error(message, exc_info=sys.exc_info(), stack_info=True, extra={'loglevel': 3})

    def error(self, message:str) -> None:
        """
        emits error log
        :param message: log
        """
        self.log.error(message, extra={'loglevel': 3})

    def debug(self, message:str) -> None:
        """
        emits debug log
        :param message: log
        """
        self.log.debug(message, extra={'loglevel': 7})

    def info(self, message:str) -> None:
        """
        emits info log
        :param message: log
        """
        self.log.info(message, extra={'loglevel': 6})

    def warn(self, message:str) -> None:
        """
        emits warn log
        :param message: log
        """
        self.log.warning(message, extra={'loglevel': 4})
