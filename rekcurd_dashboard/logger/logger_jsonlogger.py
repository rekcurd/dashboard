#!/usr/bin/python
# -*- coding: utf-8 -*-

import sys
import time
import logging
from socket import gethostname
from pythonjsonlogger import jsonlogger
from .logger_interface import SystemLoggerInterface

class JsonSystemLogger(SystemLoggerInterface):
    class JsonFormatter(jsonlogger.JsonFormatter):
        def parse(self):
            return [
                'host',
                'short_message',
                'timestamp',
                'level'
            ]

        def add_fields(self, log_record, record, message_dict):
            super().add_fields(log_record, record, message_dict)
            log_record['host'] = gethostname()
            log_record['timestamp'] = int(time.time() * 1000) / 1000

    def __init__(self, logger_name:str='rekcurd_dashboard', log_level:int=logging.NOTSET) -> None:
        """
        constructor
        :param logger_name: logger name
        :param log_level:
        """
        super().__init__()
        self.log = logging.getLogger(logger_name)
        handler = logging.StreamHandler()
        formatter = self.JsonFormatter()
        handler.setFormatter(formatter)
        self.log.handlers = []
        self.log.addHandler(handler)
        self.log.setLevel(log_level)

    def exception(self, message:str) -> None:
        """
        emmits exception to log
        :param message: error message
        """
        self.log.error(message, exc_info=sys.exc_info(), stack_info=True, extra={'short_message': message, 'level': 3})

    def error(self, message:str) -> None:
        """
        emits error log
        :param message: log
        """
        self.log.error(message, extra={'short_message': message, 'level': 3})

    def debug(self, message:str) -> None:
        """
        emits debug log
        :param message: log
        """
        self.log.debug(message, extra={'short_message': message, 'level': 7})

    def info(self, message:str) -> None:
        """
        emits info log
        :param message: log
        """
        self.log.info(message, extra={'short_message': message, 'level': 6})

    def warn(self, message:str) -> None:
        """
        emits warn log
        :param message: log
        """
        self.log.warning(message, extra={'short_message': message, 'level': 4})
