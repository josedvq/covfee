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


def test_condition(c, node: NodeInstance):
    if c["type"] == "moment":
        start_time = datetime.strptime(c["datetime"], "%m/%d/%y %H:%M:%S")
        return datetime.now() > start_time
    elif c["type"] == "all_journeys":
        return len(node.journeys) == len(node.curr_journeys)
    elif c["type"] == "n_journeys":
        return len(node.curr_journeys) >= c["n"]
    elif c["type"] == "timer":
        if node.started_at is None:
            return False
        return node.started_at + datetime(second=c["seconds"]) > datetime.now()
    else:
        raise ValueError(f'Unknown condition type {c["type"]}')


def test_conditions(conditions, node: NodeInstance) -> bool:
    for c in conditions:
        if test_condition(c, node):
            return True
    return False
