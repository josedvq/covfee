import hashlib
import hmac

from ..orm import db
from .. import tasks
from ..tasks.base import BaseCovfeeTask
from flask import current_app as app, session
from flask_socketio import SocketIO, send, emit, join_room, leave_room
from covfee.server.orm.task import TaskResponse
from covfee.server.socketio.redux_store import ReduxStoreClient

socketio = SocketIO()
store = ReduxStoreClient()

def get_task_object(responseId: int):
    response = db.session.query(TaskResponse).get(responseId)
    if response is None:
        return None
    
    task = response.task
    task_class = getattr(tasks, task.spec.spec['type'], BaseCovfeeTask)
    task_object = task_class(response=response)
    return task_object


@socketio.on('message')
def handle_message(data):
    pass


@socketio.on('join')
def on_join(data):
    room = str(data['room'])

    res = store.join(room)
    if res['success']:
        join_room(room)
        session['room'] = room
        emit('state', res)

        # if this is the first join, run the on_first_join callback
        if res['numConnections'] == 1:
            get_task_object(int(room)).on_first_join()

    else:
        send(f'Unable to join room {room}')


@socketio.on('action')
def on_action(data):
    action = data['action']
    room = str(data['room'])
    if room != session['room']:
        return send(f'data["room"] does not match session\'s room variable. {room} != {session["room"]}')

    res = store.action(room, action)
    if res['success']:
        emit('action', res, to=room)


@socketio.on('state')
def on_state(data):
    room = str(data['room'])
    if room != session['room']:
        return send(f'data["room"] does not match session\'s room variable. {room} != {session["room"]}')

    res = store.state(room)
    if res['success']:
        emit('state', res)


@socketio.on('leave')
def on_leave(data):
    room = str(data['room'])
    if room != session['room']:
        return send(f'data["room"] does not match session\'s room variable. {room} != {session["room"]}')

    res = store.leave(room)
    session['room'] = None
    leave_room(room)

    # if the room is now empty
    if res['numConnections'] == 0:
        get_task_object(int(room)).on_last_leave()

@socketio.on('disconnect')
def disconnect():
    if 'room' in session:
        room = session['room']
        res = store.leave(room)
        session['room'] = None
        leave_room(room)



