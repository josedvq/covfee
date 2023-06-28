import enum
import datetime


def to_dict(attrib):
    if isinstance(attrib, enum.Enum):
        return attrib.name
    if isinstance(attrib, datetime.date):
        return str(attrib)
    else:
        return attrib
