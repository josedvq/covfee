import random
from typing import Dict, Any
from sqlalchemy import JSON
from sqlalchemy.orm import declarative_base, DeclarativeBase, MappedAsDataclass
# Base = declarative_base()

class Base(MappedAsDataclass, DeclarativeBase):
    type_annotation_map = {
        Dict[str, Any]: JSON
    }

    # random unique ID to use as hash key
    _unique_id: int

    def __init__(self):
        self._unique_id = random.getrandbits(256)

    

    def to_dict(self):
        instance_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}

        return instance_dict