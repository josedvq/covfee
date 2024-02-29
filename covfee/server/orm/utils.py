from __future__ import annotations
from typing import TYPE_CHECKING, Union
import enum
from datetime import date, datetime

if TYPE_CHECKING:
    from .node import NodeInstance


def datetime_to_str(dt: Union[datetime, None]):
    if dt is None:
        return None
    return dt.isoformat()


def to_dict(attrib):
    if isinstance(attrib, bytes):
        return attrib.hex()
    if isinstance(attrib, enum.Enum):
        return attrib.name
    if isinstance(attrib, date):
        return str(attrib)
    if isinstance(attrib, datetime):
        return datetime_to_str(attrib)
    else:
        return attrib
