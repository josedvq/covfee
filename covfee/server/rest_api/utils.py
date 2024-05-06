import json
from enum import Enum
from typing import List, Union

import requests
from flask import jsonify
from flask.json.provider import JSONProvider


class ProlificAPIRequestError(Exception):
    def __init__(self, message):
        self.message = message
        super().__init__(self.message)


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


def fetch_prolific_ids_for_invalid_participants(study_id: str, token: str) -> List[str]:
    """
    Use the Prolific Academic API to get the IDs of participants who have failed to do
    the study. Either because they abandoned it (RETURNED), because we rejected the data
    that they submitted (REJECTED) or they failed to complete it on time (TIMED-OUT).
    See https://docs.prolific.com/docs/api-docs/public/#tag/Submissions/Submission-object
    """
    headers = {
        "Authorization": f"Token {token}",
    }

    params = {"study": study_id}

    try:
        response = requests.get(
            "https://api.prolific.com/api/v1/submissions/",
            headers=headers,
            params=params,
        )
        response.raise_for_status()
    except requests.exceptions.HTTPError as err:
        raise ProlificAPIRequestError(
            f"HTTP error occurred while requesting prolific data: {err}"
        )
    except requests.exceptions.RequestException as err:
        raise ProlificAPIRequestError(
            f"Request error occurred while requesting prolific data: {err}"
        )
    else:
        return [
            participant["participant_id"]
            for participant in response.json()["results"]
            if participant["status"] in ["RETURNED", "REJECTED", "TIMED-OUT"]
        ]
