from typing import Dict

from .socket import socketio
from covfee.server.orm.chat import ChatMessage
from covfee.server.socketio.handlers import get_chat

from flask import current_app as app, session
from flask_socketio import send, emit, join_room


def on_chat(data: Dict):
    if "chatId" not in data:
        return send(f"chatId not sent")

    chatId = int(data["chatId"])
    message = ChatMessage(data["message"])
    chat = get_chat(chatId)
    if chat is None:
        return send(f"chat not found")
    chat.messages.append(message)
    app.session.commit()

    # emit the message
    emit("message", message.to_dict(), to=chatId, namespace="/chat")

    # broadcast to admins
    emit("message", message.to_dict(), namespace="/admin_chat", broadcast=True)


socketio.on_event("message", on_chat, namespace="/chat")
socketio.on_event("message", on_chat, namespace="/admin_chat")
socketio.on_event("message", on_chat, namespace="/admin")


@socketio.on("join_chat", namespace="/chat")
def on_join_chat(data):
    chatId = data["chatId"]
    chat = get_chat(chatId)

    if chat is None:
        return send(f"Unable to join, chatId={chatId}")

    join_room(chat.id, namespace="/chat")
    session["chatId"] = chatId
