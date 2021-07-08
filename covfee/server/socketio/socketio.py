import hashlib
import hmac

from flask import current_app as app
from flask_socketio import SocketIO, send, emit, join_room, leave_room

socketio = SocketIO()

@socketio.on('connect')
def connect(auth):

    try:
        id = bytes.fromhex(auth['hitId'])
        receivedToken = bytes.fromhex(auth['token'])
    except ValueError:
        return False

    targetToken = hmac.new(app.config['COVFEE_SECRET_KEY'].encode('utf-8'), id, hashlib.sha256 )
    if targetToken.hexdigest() != auth['token']:
        return False

@socketio.on('disconnect')
def disconnect():
    print('Client disconnected')

@socketio.on('message')
def handle_message(data):
    print('received message: ' + data)