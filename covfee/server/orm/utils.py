from __future__ import annotations
from typing import TYPE_CHECKING
import enum
from datetime import date, datetime

if TYPE_CHECKING:
    from .node import NodeInstance


def to_dict(attrib):
    if isinstance(attrib, bytes):
        return attrib.hex()
    if isinstance(attrib, enum.Enum):
        return attrib.name
    if isinstance(attrib, date):
        return str(attrib)
    else:
        return attrib
