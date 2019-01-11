from abc import ABCMeta, abstractmethod


class Authenticator(metaclass=ABCMeta):
    @abstractmethod
    def auth_user(self, username, password):
        pass


class EmptyAuthenticator(Authenticator):
    def auth_user(self, username, password):
        return None
