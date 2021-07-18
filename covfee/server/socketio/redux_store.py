import os
import json

import zmq
from covfee.server.orm.task import Task 
context = zmq.Context()

class ReduxStoreService:
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
        # bind to a random port in loopback iface
        self.socket.connect("tcp://127.0.0.1:5555")

    def socket_request(self, payload):
        self.socket.send_json(payload)
        message = self.socket.recv()
        return json.loads(message.decode('utf-8'))

    def join(self, taskId):
        return self.socket_request({
            'command': 'join', 
            'taskId': taskId
        })

    def leave(self, taskId):
        return self.socket_request({
            'command': 'leave', 
            'taskId': taskId
        })

    def action(self, taskId, action):
        return self.socket_request({
            'command': 'action', 
            'taskId': taskId,
            'action': action
        })
        # if not result['valid']:
        #     err = result['errors'][0]
        #     raise ValidationError(
        #         message=self.get_friendly_error_message(err),
        #         path=AjvValidator.parse_ajv_path(err['instancePath']),
        #         instance=err['data']
        #     )

    def state(self, task):
        return self.socket_request({
            'command': 'state', 
            'task': task
        })
