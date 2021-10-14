import os
import json
import subprocess

import zmq

from covfee.cli.utils import working_directory
from flask import current_app as app
context = zmq.Context()

class ReduxStoreService:
    def run(self):
        with working_directory(os.path.join(app.config['COVFEE_SERVER_PATH'], 'socketio')):
            subprocess.Popen(['npx', 'pm2', 'start', 'reduxStore.js', '-i', '1', '--watch', '--', 
                'serve',
                '--database',
                app.config['DATABASE_PATH']
            ])

class ReduxStoreClient:
    ''' This class takes care of replicating the shared state in multi-party tasks server-side for 
    persistence and synchronization.
    Multiparty tasks use a synced redux store for state. The server maintains the true state by dispatching
    the Redux actions sent by each client. After being executed on the server's store, actions are sent back
    to all clients to update their state to match the server's true state.
    The true state is stored in the database for persistence.
    The server's state is kept in a nodejs service that this class communicates with via zmq.
    '''

    def __init__(self):
        #  Socket to talk to server
        self.socket = context.socket(zmq.REQ)
        self.socket.setsockopt(zmq.RCVTIMEO, 500)
        self.socket.connect("tcp://127.0.0.1:5555")

    def socket_request(self, payload):
        self.socket.send_json(payload)
        message = self.socket.recv()
        return json.loads(message.decode('utf-8'))

    def join(self, responseId):
        return self.socket_request({
            'command': 'join', 
            'responseId': responseId
        })

    def leave(self, responseId):
        return self.socket_request({
            'command': 'leave', 
            'responseId': responseId
        })

    def action(self, responseId, action):
        return self.socket_request({
            'command': 'action', 
            'responseId': responseId,
            'action': action
        })

    def state(self, responseId):
        return self.socket_request({
            'command': 'state', 
            'responseId': responseId
        })
    
    def reset(self, responseId):
        return self.socket_request({
            'command': 'reset', 
            'responseId': responseId
        })
