from threading import Thread

from flask import current_app as app
import zmq
from zmq import Context
context = Context()

# https://gist.github.com/dmfigol/3e7d5b84a16d076df02baa9f53271058
class DeepStreamSubscriber:
    ''' A subscriber listens to events coming from the JS deepstream subscribers/listener
        to be relayed to Python for the dispatch of events.
    '''

    def __init__(self):
        self.event_handlers = {}
        
    def run(self):
        self.app = app._get_current_object()
        t = Thread(target=self.listen, daemon=True)
        t.start()

    def listen(self):
        socket = context.socket(zmq.SUB)
        socket.setsockopt(zmq.SUBSCRIBE, b"")
        socket.connect(f"tcp://localhost:{app.config['DS_CLIENT_PUB_PORT']}")
        
        count = 0
        while True:
            [topic, msg] = socket.recv_multipart()
            topic = topic.decode('ascii')
            responseId = int(msg.decode('ascii'))
            if topic in self.event_handlers:
                
                with self.app.app_context():
                    self.event_handlers[topic](responseId)
            else:
                print((topic, count))
            count += 1

    def on(self, event_name):
        def decorator(func):
            self.event_handlers[event_name] = func

            def wrapper(*args, **kwargs):
                return func(*args, **kwargs)
            return wrapper
        return decorator



            