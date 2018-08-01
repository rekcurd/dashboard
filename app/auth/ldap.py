import ldap
from apis import logger


class LdapAuthenticator(object):
    def __init__(self, config):
        self.host = config['host']
        self.port = config['port']
        self.bind_dn = config['bind_dn']
        self.bind_password = config['bind_password']
        self.search_filter = config['search_filter']
        self.search_base_dns = config['search_base_dns']

    def auth_user(self, username, password):
        l = ldap.initialize('ldap://{}:{}'.format(self.host, self.port))
        try:
            l.bind_s(self.bind_dn, self.bind_password)
            filter_str = self.search_filter % username
            for search_baase_dn in self.search_base_dns:
                result = l.search_s(search_baase_dn, ldap.SCOPE_SUBTREE, filter_str)
                user_dn, user_attrs = result[0]
                l.simple_bind_s(user_dn, password)
                return username
            return None
        except IndexError:
            logger.error('"{}" not found'.format(username))
            return None
        except ldap.LDAPError as e:
            logger.error(e)
            return None
