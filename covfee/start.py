from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
import json
import os
import glob

from flask import Flask, Response, render_template, request, jsonify, Blueprint, send_from_directory
from flask_cors import cross_origin, CORS
from orm import Project, Timeline, Task, Chunk
from constants import APP_PORT, WEBPACK_URL

app = Flask(__name__, static_folder=None)
engine = create_engine('sqlite:///database.db', echo=True)
Session = sessionmaker(bind=engine)
session = Session()

cors = CORS(app, resources={r"/*": {"origins": "*"}})

# APP ROUTES
@app.route('/')
def main():
    return render_template('app.html', dist_url=WEBPACK_URL)

@app.route('/static/<path:filename>')
def uploaded_file(filename):
    print('jere')
    return send_from_directory('static', filename,
                            conditional=True)

# API ROUTES
api = Blueprint('api', __name__)
@api.route('/ping')
def ping():
    return jsonify({'success': true})

@api.route('/projects')
def projects():
    res = session.query(Project).all()
    return jsonify([p.as_dict() for p in res])

# returns a project for annotation
@api.route('/projects/<pid>')
def project(pid):
    res = session.query(Project).get(pid)
    return jsonify(res.as_dict())

# returns a timeline for annotation
@api.route('/timelines/<tid>')
def timeline(tid):
    res = session.query(Timeline).get(bytes.fromhex(tid))
    return jsonify(res.as_dict(with_tasks=True))

# timeline completed
@api.route('/timelines/<tid>/submit', methods=['POST'])
def timeline_submit(tid):
    tmln = session.query(Timeline).get(bytes.fromhex(tid))
    tmln.submitted = True
    session.commit()
    return timeline(tid)

# receives a task answer
@api.route('/timelines/<tid>/tasks/<kid>/submit', methods=['POST'])
def submit(tid, kid):
    timeline = session.query(Timeline).get(bytes.fromhex(tid))
    task = timeline.tasks[int(kid)]
    task.response = request.json
    session.commit()
    return jsonify({'msg': "Stored successfully"}), 201

# receives a chunk of user interaction data
@api.route('/timelines/<tid>/tasks/<kid>/chunk', methods=['POST'])
def chunk(tid, kid):
    timeline = session.query(Timeline).get(bytes.fromhex(tid))
    task = timeline.tasks[int(kid)]
    chunk = Chunk(request.json)
    task.chunks.append(chunk)
    session.commit()
    return jsonify({'msg': "Stored successfully"}), 201

app.register_blueprint(api, url_prefix='/api')

if __name__ == '__main__':
    app.run(processes=3, port=APP_PORT)
