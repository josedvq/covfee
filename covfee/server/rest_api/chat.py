from flask import (
    current_app as app,
    jsonify,
)
from sqlalchemy import select

from .api import api
from ..orm import Chat


@api.route("/chats/<chat_ids>")
def chat(chat_ids: str):
    chat_ids = [int(e) for e in chat_ids.split(",")]
    rows = app.session.execute(select(Chat).where(Chat.id.in_(chat_ids))).all()
    return jsonify([r[0].to_dict() for r in rows])
