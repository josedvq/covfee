from .db import db
from hashlib import pbkdf2_hmac

from flask import current_app as app

def password_hash(password: str):
    return pbkdf2_hmac('sha256', password.encode(), app.config['JWT_SECRET_KEY'].encode(), 10000)

class User(db.Model):
    """ Represents a covfee user """
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String) # note username is non-unique
    roles = db.Column(db.JSON)

    providers = db.relationship("AuthProvider", backref="user", cascade="all, delete")

    def __init__(self, username: str, roles: list = ['user', 'admin']):
        self.username = username
        self.roles = roles

    def add_provider(self, *args, **kwargs):
        self.providers.append(AuthProvider(*args, **kwargs))

class AuthProvider(db.Model):
    __tablename__ = 'auth_providers'

    provider_id = db.Column(db.String, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), primary_key=True)

    # holds provider specific information like the password for password provider
    extra = db.Column(db.JSON)

    def __init__(self, provider_id: str, user_id: str, extra=None):
        self.provider_id = provider_id
        self.user_id = user_id
        self.extra = extra

    
