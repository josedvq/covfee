import hashlib
import random
import secrets
from typing import Any, Dict

from sqlalchemy import JSON
from sqlalchemy.orm import DeclarativeBase

from . import utils


class Base(DeclarativeBase):
    type_annotation_map = {Dict[str, Any]: JSON}

    # random unique ID to use as hash key
    _unique_id: int
    _instance_counter: int = 0

    _config: Dict[str, Any]

    # keeps a reference to the app's sessionmaker
    # necessary to create sessions from apscheduler
    sessionmaker = None
    
    def init(self):
        self._unique_id = random.getrandbits(256)


    def to_dict(self):
        instance_dict = {
            c.name: utils.to_dict(getattr(self, c.name)) for c in self.__table__.columns
        }

        return instance_dict
    
    

    @classmethod
    def make_random_id(cls):
        if cls._config.get('COVFEE_ENV', 'prod') != 'prod':
            # return predictable id in dev mode
            # so that URLs don't change on every run
            id = hashlib.sha256(
                (str(cls._instance_counter).encode())
            ).digest()
            cls._instance_counter += 1
        else:
            id = secrets.token_bytes(32)
        return id
    


        