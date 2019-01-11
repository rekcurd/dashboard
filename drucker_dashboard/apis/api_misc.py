# coding: utf-8


from flask_restplus import Resource, Namespace

from . import api


misc_info_namespace = Namespace('misc', description='Misc Endpoint.')


@misc_info_namespace.route('/settings')
class Settings(Resource):
    def get(self):
        result = {
            'auth': api.dashboard_config.IS_ACTIVATE_AUTH
        }
        return result
