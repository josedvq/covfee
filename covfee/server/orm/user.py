from .db import db
from hashlib import pbkdf2_hmac

from flask import current_app as app

class User(db.Model):
    """ Represents a covfee user """
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String)
    password = db.Column(db.LargeBinary)
    roles = db.Column(db.JSON)

    def __init__(self, username: str, password: str, roles: list = ['user']):
        self.username = username
        self.password = User.password_hash(password)
        self.roles = roles

    @staticmethod
    def password_hash(password: str):
        return pbkdf2_hmac('sha256', password.encode(), app.config['JWT_SECRET_KEY'].encode(), 10000)
