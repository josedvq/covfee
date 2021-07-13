import hashlib
import hmac

from flask import current_app as app
from flask_socketio import SocketIO, send, emit, join_room, leave_room

socketio = SocketIO()

@socketio.on('connect')
def connect(auth):

    try:
        id = bytes.fromhex(auth['hitId'])
    except ValueError:
        return False

    targetToken = hmac.new(app.config['COVFEE_SECRET_KEY'].encode('utf-8'), id, hashlib.sha256 )
    if targetToken.hexdigest() != auth['token']:
        return False

@socketio.on('disconnect')
def disconnect():
    print('Client disconnected')

@socketio.on('join')
def on_join(data):
    username = data['username']
    room = data['room']
    join_room(room)
    print(username + ' has entered the room.')
    send(username + ' has entered the room.', to=room)

@socketio.on('leave')
def on_leave(data):
    username = data['username']
    room = data['room']
    leave_room(room)
    send(username + ' has left the room.', to=room)

@socketio.on('message')
def handle_message(data):
    print('received message: ' + data)

@socketio.on('action')
def on_action(data):
    emit('action', data, broadcast=True)
    print(data)