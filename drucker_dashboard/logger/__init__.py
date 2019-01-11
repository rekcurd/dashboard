# -*- coding: utf-8 -*-

from .logger_interface import SystemLoggerInterface
from .logger_jsonlogger import JsonSystemLogger
from .logger_fluent import FluentSystemLogger


logger = JsonSystemLogger()
