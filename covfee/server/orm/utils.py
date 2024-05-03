from __future__ import annotations
from typing import TYPE_CHECKING, Union
import enum
from datetime import date, datetime
import json
from _ctypes import PyObj_FromPtr
import re

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


class NoIndentJSON(object):
    def __init__(self, value):
        self.value = value


# JSON encoder that avoids indenting any object of type NoIndentList.
# See https://stackoverflow.com/a/13252112
# The list of annotations could be very long when formatted in a single column, like so:
# annotations: { [
#  0,
#  0,
#  ...
#  0,
#  0
# ] }
#
# Instead this class allows skipping indentations of any entry that is a
# subclass of NoIndentJSON, like so:
# annotations: { [0, 0, ..., 0, 0] }
class NoIndentJSONEncoder(json.JSONEncoder):
    FORMAT_SPEC = "@@{}@@"
    regex = re.compile(FORMAT_SPEC.format(r"(\d+)"))

    def __init__(self, **kwargs):
        # Save copy of any keyword argument values needed for use here.
        self.__sort_keys = kwargs.get("sort_keys", None)
        super(NoIndentJSONEncoder, self).__init__(**kwargs)

    def default(self, obj):
        return (
            self.FORMAT_SPEC.format(id(obj))
            if isinstance(obj, NoIndentJSON)
            else super(NoIndentJSONEncoder, self).default(obj)
        )

    def encode(self, obj):
        format_spec = self.FORMAT_SPEC  # Local var to expedite access.
        json_repr = super(NoIndentJSONEncoder, self).encode(obj)  # Default JSON.

        # Replace any marked-up object ids in the JSON repr with the
        # value returned from the json.dumps() of the corresponding
        # wrapped Python object.
        for match in self.regex.finditer(json_repr):
            # see https://stackoverflow.com/a/15012814/355230
            id = int(match.group(1))
            no_indent = PyObj_FromPtr(id)
            json_obj_repr = json.dumps(no_indent.value, sort_keys=self.__sort_keys)

            # Replace the matched id string with json formatted representation
            # of the corresponding Python object.
            json_repr = json_repr.replace(
                '"{}"'.format(format_spec.format(id)), json_obj_repr
            )

        return json_repr
