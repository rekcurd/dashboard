from flask_restplus import Resource, Namespace
from utils.env_loader import config

misc_info_namespace = Namespace('misc', description='Misc Endpoint.')

@misc_info_namespace.route('/settings')
class Settings(Resource):
    def get(self):
        result = {
            'auth': 'auth' in config
        }
        return result
