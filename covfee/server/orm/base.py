import random
from typing import Dict, Any
from sqlalchemy import JSON
from sqlalchemy.orm import DeclarativeBase
from . import utils


class Base(DeclarativeBase):
    type_annotation_map = {Dict[str, Any]: JSON}

    # random unique ID to use as hash key
    _unique_id: int

    def init(self):
        self._unique_id = random.getrandbits(256)

    def to_dict(self):
        instance_dict = {
            c.name: utils.to_dict(getattr(self, c.name)) for c in self.__table__.columns
        }

        return instance_dict
