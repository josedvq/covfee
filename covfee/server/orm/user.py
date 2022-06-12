from hashlib import pbkdf2_hmac

from flask import current_app as app
from sqlalchemy import (Column, Integer, JSON, String,
    ForeignKey)
from sqlalchemy.orm import relationship

from .base import Base

def password_hash(password: str):
    return pbkdf2_hmac('sha256', password.encode(), app.config['JWT_SECRET_KEY'].encode(), 10000)

class User(Base):
    """ Represents a covfee user """
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    username = Column(String) # note username is non-unique
    roles = Column(JSON)

    providers = relationship("AuthProvider", backref="user", cascade="all, delete")

    def __init__(self, username: str, roles: list = ['user', 'admin']):
        self.username = username
        self.roles = roles

    def add_provider(self, *args, **kwargs):
        self.providers.append(AuthProvider(*args, **kwargs))

class AuthProvider(Base):
    __tablename__ = 'auth_providers'

    provider_id = Column(String, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), primary_key=True)

    # holds provider specific information like the password for password provider
    extra = Column(JSON)

    def __init__(self, provider_id: str, user_id: str, extra=None):
        self.provider_id = provider_id
        self.user_id = user_id
        self.extra = extra

    
