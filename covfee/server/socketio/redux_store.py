import json
import os

import zmq

context = zmq.Context()


class ReduxStoreClient:
    """This class takes care of replicating the shared state in multi-party tasks server-side for
    persistence and synchronization.
    Multiparty tasks use a synced redux store for state. The server maintains the true state by dispatching
    the Redux actions sent by each client. After being executed on the server's store, actions are sent back
    to all clients to update their state to match the server's true state.
    The true state is stored in the database for persistence.
    The server's state is kept in a nodejs service that this class communicates with via zmq.
    """

    def __init__(self):
        #  Socket to talk to server
        self.socket = context.socket(zmq.REQ)
        self.socket.setsockopt(zmq.RCVTIMEO, 500)
        host = os.environ.get("COVFEE_REDUX_STORE_HOST", "127.0.0.1")
        port = os.environ.get("COVFEE_REDUX_STORE_PORT", "5555")
        self.socket.connect(f"tcp://{host}:{port}")

    def socket_request(self, payload):
        self.socket.send_json(payload)
        try:
            message = self.socket.recv()
        except zmq.error.Again as e:
            raise RuntimeError(
                "The Redux store service may not be running or the store service host/port may be incorrect"
            ) from e
        return json.loads(message.decode("utf-8"))

    def join(self, nodeId, taskName, currState):
        return self.socket_request(
            {
                "command": "join",
                "responseId": nodeId,
                "taskName": taskName,
                "currState": currState,
            }
        )

    def leave(self, nodeId):
        return self.socket_request({"command": "leave", "responseId": nodeId})

    def action(self, nodeId, action):
        return self.socket_request(
            {"command": "action", "responseId": nodeId, "action": action}
        )

    def state(self, nodeId):
        return self.socket_request({"command": "state", "responseId": nodeId})

    def reset(self, nodeId):
        return self.socket_request({"command": "reset", "responseId": nodeId})
