from __future__ import annotations
from hashlib import pbkdf2_hmac
from typing import List, Dict, Any

from flask import current_app as app

# from covfee.server.db import Base
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column

from .base import Base


def password_hash(password: str):
    return pbkdf2_hmac(
        "sha256", password.encode(), app.config["JWT_SECRET_KEY"].encode(), 10000
    )


class User(Base):
    """Represents a covfee user"""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str]
    # roles: Mapped[Dict[str, Any]]

    providers: Mapped[List[AuthProvider]] = relationship(
        "AuthProvider", backref="user", cascade="all, delete"
    )

    def __init__(self, username: str, roles: list = ["user", "admin"]):
        super().init()
        self.username = username
        self.roles = roles

    def add_provider(self, *args, **kwargs):
        self.providers.append(AuthProvider(*args, **kwargs))


class AuthProvider(Base):
    __tablename__ = "auth_providers"

    provider_id: Mapped[str] = mapped_column(primary_key=True)
    # provider_id = Column(String, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    # user_id = Column(Integer, ForeignKey('users.id'), primary_key=True)

    # holds provider specific information like the password for password provider
    # extra: Mapped[Dict[str, Any]]

    def __init__(self, provider_id: str, user_id: str, extra=None):
        super().init()
        self.provider_id = provider_id
        self.user_id = user_id
        self.extra = extra
