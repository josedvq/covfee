from datetime import datetime, timedelta
from typing import Dict

from flask import current_app as app
from flask import session
from flask_socketio import emit, join_room, send

from covfee.server.orm.chat import ChatJourney, ChatMessage
from covfee.server.socketio.handlers import get_chat

from .socket import socketio

# def on_chat(data: Dict):
#     app.logger.info(f"socketio/chat: message {str(data)}")
#     if "chatId" not in data:
#         return send(f"chatId not sent")

#     chatId = int(data["chatId"])
#     message = ChatMessage(data["message"])
#     chat = get_chat(chatId)
#     if chat is None:
#         return send(f"chat not found")
#     chat.messages.append(message)
#     app.session.commit()

#     # emit the message
#     emit("message", message.to_dict(), to=chatId, namespace="/chat")

#     # broadcast to admins
#     emit("message", message.to_dict(), namespace="/admin_chat", broadcast=True)


# socketio.on_event("message", on_chat, namespace="/chat")
# socketio.on_event("message", on_chat, namespace="/admin_chat")
# socketio.on_event("message", on_chat, namespace="/admin")

@socketio.on("message", namespace="/chat")
def on_message(data: Dict):
    app.logger.info(f"socketio/chat: message {str(data)}")
    if "chatId" not in data:
        return send(f"chatId not sent")

    chatId = int(data["chatId"])
    journeyId = bytes.fromhex(data["journeyId"])

    assoc: ChatJourney = app.session.query(ChatJourney).get((journeyId, chatId))
    if assoc is None:
        return send(f"Unable to find assoc {(journeyId, chatId)}")

    message = ChatMessage(data["message"])
    assoc.chat.messages.append(message)
    assoc.read_at = datetime.now() + timedelta(seconds=1)
    app.session.commit()

    # emit the message
    emit("chat_update", message.make_chat_update_payload(), to=chatId, namespace="/chat")

    # broadcast to admins
    emit("chat_update", message.make_chat_update_payload(), namespace="/admin_chat", broadcast=True)

@socketio.on("message", namespace="/admin_chat")
def on_message(data: Dict):
    app.logger.info(f"socketio/chat: message {str(data)}")
    if "chatId" not in data:
        return send(f"chatId not sent")

    chatId = int(data["chatId"])
    message = ChatMessage(data["message"])
    chat = get_chat(chatId)
    if chat is None:
        return send(f"chat not found")
    chat.messages.append(message)
    chat.read_by_admin_at = datetime.now() + timedelta(seconds=1)
    app.session.commit()

    # emit the message
    emit("chat_update", message.make_chat_update_payload(), to=chatId, namespace="/chat")

    # broadcast to admins
    emit("chat_update", message.make_chat_update_payload(), namespace="/admin_chat", broadcast=True)

@socketio.on("join_chat", namespace="/chat")
def on_join_chat(data):
    app.logger.info(f"socketio/chat: join_chat {str(data)}")
    chatId = data["chatId"]
    chat = get_chat(chatId)

    if chat is None:
        return send(f"Unable to join, chatId={chatId}")

    join_room(chat.id, namespace="/chat")
    session["chatId"] = chatId


@socketio.on("read", namespace="/chat")
def on_read(data):
    """Chat read by a journey"""
    app.logger.info(f"socketio/chat: read {str(data)}")

    chatId = int(data["chatId"])
    journeyId = bytes.fromhex(data["journeyId"])

    assoc = app.session.query(ChatJourney).get((journeyId, chatId))
    if assoc is None:
        return send(f"Unable to find assoc {(journeyId, chatId)}")

    assoc.read_at = datetime.now() + timedelta(seconds=1)
    app.session.commit()

    payload = assoc.chat.to_dict(exclude=["messages"])
    emit("chat_update", payload, to=chatId, namespace="/chat")
    emit("chat_update", payload, namespace="/admin_chat", broadcast=True)


@socketio.on("read", namespace="/admin_chat")
def on_admin_read(data):
    """Chat read by an admin"""
    app.logger.info(f"socketio/admin_chat: read {str(data)}")
    chatId = int(data["chatId"])
    chat = get_chat(chatId)

    if chat is None:
        return send(f"Unable to find chatId={chatId}")

    chat.read_by_admin_at = datetime.now() + timedelta(seconds=1)
    app.session.commit()

    chat_dict = chat.to_dict(exclude=["messages"])
    emit("chat_update", chat_dict, to=chatId, namespace="/chat")
    emit("chat_update", chat_dict, namespace="/admin_chat", broadcast=True)
