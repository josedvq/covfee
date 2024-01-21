import json
from typing import Union
from enum import Enum
from flask import jsonify
from flask.json.provider import JSONProvider


def jsonify_or_404(res, **kwargs):
    if res is None:
        return {"msg": "not found"}, 404
    else:
        return jsonify(res.to_dict(**kwargs))


class CovfeeJSONEncoder(json.JSONEncoder):
    """
    Used to help jsonify numpy arrays or lists that contain numpy data types.
    """

    def default(self, obj):
        if isinstance(obj, Enum):
            return obj.name
        else:
            return super().default(obj)


class CovfeeJSONProvider(JSONProvider):
    def dumps(self, obj, **kwargs):
        return json.dumps(obj, **kwargs, cls=CovfeeJSONEncoder)

    def loads(self, s: Union[str, bytes], **kwargs):
        return json.loads(s, **kwargs)
