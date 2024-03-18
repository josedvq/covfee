from __future__ import annotations

from hashlib import pbkdf2_hmac
from typing import Any, Dict, List

from flask import current_app as app

# from covfee.server.db import Base
from sqlalchemy import ForeignKey, select
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


def password_hash(password: str, secret=None):
    if secret is None:
        secret = app.config["JWT_SECRET_KEY"]
    return pbkdf2_hmac("sha256", password.encode(), secret.encode(), 10000)


class User(Base):
    """Represents a covfee user"""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(unique=True)
    roles: Mapped[Dict[str, Any]]

    providers: Mapped[List[AuthProvider]] = relationship(
        "AuthProvider", backref="user", cascade="all, delete"
    )

    def __init__(self, username: str, roles: list = ["user", "admin"]):
        super().init()
        self.username = username
        self.roles = roles

    def add_provider(self, *args, **kwargs):
        self.providers.append(AuthProvider(*args, **kwargs))

    @classmethod
    def from_username_password(cls, username: str, password: str, secret=None):
        user = cls(username)
        user.providers.append(
            AuthProvider(
                "password",
                user.id,
                {"password": password_hash(password, secret=secret).hex()},
            )
        )
        return user

    @staticmethod
    def by_username(session, username: int):
        return (
            session.execute(select(User).where(User.username == username))
            .scalars()
            .first()
        )


class AuthProvider(Base):
    __tablename__ = "auth_providers"

    provider_id: Mapped[str] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)

    # holds provider specific information like the password for password provider
    extra: Mapped[Dict[str, Any]]

    def __init__(self, provider_id: str, user_id: str, extra=None):
        super().init()
        self.provider_id = provider_id
        self.user_id = user_id
        self.extra = extra
