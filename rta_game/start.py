from flask import Flask, Response, render_template
from flask_socketio import SocketIO, send, emit

from .streaming.pyaudio import PyaudioSource
from .streaming.headers import gen_wave_header
from .transform.basic import BasicTransform

app = Flask(__name__)
dist_url = 'http://localhost:8080'
socketio = SocketIO(app, async_mode='threading')

@app.route('/')
def main():
    return render_template('app.html', dist_url=dist_url)


if __name__ == '__main__':
    app.run(threaded=True)
