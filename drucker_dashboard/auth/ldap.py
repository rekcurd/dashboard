import ldap

from .authenticator import Authenticator


class LdapAuthenticator(Authenticator):
    def __init__(self, config, logger):
        self.host = config['host']
        self.port = config['port']
        self.bind_dn = config['bind_dn']
        self.bind_password = config['bind_password']
        self.search_filter = config['search_filter']
        self.search_base_dns = config['search_base_dns']
        self.logger = logger

    def auth_user(self, username, password):
        lobj = ldap.initialize('ldap://{}:{}'.format(self.host, self.port))
        try:
            lobj.bind_s(self.bind_dn, self.bind_password)
            filter_str = self.search_filter % username
            for search_baase_dn in self.search_base_dns:
                result = lobj.search_s(search_baase_dn, ldap.SCOPE_SUBTREE, filter_str)
                user_dn, user_attrs = result[0]
                lobj.simple_bind_s(user_dn, password)
                return {
                    'uid': username,
                    'name': user_attrs.get('givenName', [b''])[0].decode('utf-8')
                }
            return None
        except IndexError:
            self.logger.error('"{}" not found'.format(username))
            return None
        except ldap.LDAPError as e:
            self.logger.error(e)
            return None
