from flask_restplus import fields
from logger.logger_jsonlogger import SystemLogger

logger = SystemLogger(logger_name="drucker_dashboard")


class DatetimeToTimestamp(fields.Raw):
    def format(self, value):
        return value.timestamp()
