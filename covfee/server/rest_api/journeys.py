from flask import (
    request,
    jsonify,
    redirect,
    Response,
    stream_with_context,
    current_app as app,
)
import zipstream

from .api import api
from .auth import admin_required
from .utils import jsonify_or_404
from ..orm import JourneyInstance

# Journeys


# return one HIT instance
@api.route("/journeys/<jid>")
def journey(jid):
    with_nodes = request.args.get("with_nodes", True)
    with_response_info = request.args.get("with_response_info", True)
    res = app.session.query(JourneyInstance).get(bytes.fromhex(jid))
    return jsonify_or_404(
        res, with_nodes=with_nodes, with_response_info=with_response_info
    )
