from flask import (
    request,
    jsonify,
    redirect,
    Response,
    stream_with_context,
    current_app as app,
)

from .api import api
from .auth import admin_required
from .utils import jsonify_or_404
from ..orm import Chat


@api.route("/chats/<cid>")
def chat(cid):
    res = app.session.query(Chat).get(cid)
    return jsonify_or_404(res)
