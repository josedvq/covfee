import json
import os
import glob
from hashlib import sha256

from flask import Flask, Response, render_template, request, jsonify, Blueprint, send_from_directory
from flask_cors import cross_origin, CORS

from orm import db, Project, Timeline, Task, Chunk
if os.environ['COVFEE_ENV'] == 'production':
    from constants_prod import *
else:
    from constants_dev import *

def create_app():
    app = Flask(__name__, static_folder=None)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
    db.init_app(app)
    app.register_blueprint(frontend, url_prefix='/')
    app.register_blueprint(api, url_prefix='/api')
    cors = CORS(app, resources={r"/*": {"origins": "*"}})
    return app


# APP ROUTES
frontend = Blueprint('frontend', __name__)
@frontend.route('/')
def main():
    return render_template('app.html', api_url=API_URL, static_url=STATIC_URL, bundle_url=BUNDLE_URL)

@frontend.route('/static/<path:filename>')
def uploaded_file(filename):
    return send_from_directory('static', filename,
                            conditional=True)

# API ROUTES
api = Blueprint('api', __name__)
@api.route('/ping')
def ping():
    return jsonify({'success': True})

@api.route('/projects')
def projects():
    res = db.session.query(Project).all()
    return jsonify([p.as_dict() for p in res])

# returns a project for annotation
@api.route('/projects/<pid>')
def project(pid):
    res = db.session.query(Project).get(pid)
    return jsonify(res.as_dict())

# TIMELINE
# returns a timeline for annotation
@api.route('/timelines/<tid>')
def timeline(tid):
    res = db.session.query(Timeline).get(bytes.fromhex(tid))
    return jsonify(res.as_dict(with_tasks=True))

# timeline completed
@api.route('/timelines/<tid>/submit', methods=['POST'])
def timeline_submit(tid):
    tmln = db.session.query(Timeline).get(bytes.fromhex(tid))
    tmln.submitted = True
    db.session.commit()
    return timeline(tid)

# TASK
# adds a task to a timeline
@api.route('/timelines/<tid>/tasks/add', methods=['POST'])
def task_add(tid):
    timeline = db.session.query(Timeline).get(bytes.fromhex(tid))
    task = Task(**request.json)
    timeline.tasks.append(task)
    db.session.commit()
    return jsonify(task.as_dict())

# edits an existing task
@api.route('/timelines/<tid>/tasks/<kid>/edit', methods=['POST'])
def task_edit(tid, kid):
    task = db.session.query(Task).get(int(kid))
    task.name = request.json['name']
    db.session.commit()
    return jsonify(task.as_dict())

# deletes an existing task
@api.route('/timelines/<tid>/tasks/<kid>/delete')
def task_delete(tid, kid):
    task = db.session.query(Task).get(int(kid))
    task.delete()
    db.session.commit()
    return json.dumps({'success': True}), 204

# receives a task answer
@api.route('/timelines/<tid>/tasks/<kid>/submit', methods=['POST'])
def task_submit(tid, kid):
    task = db.session.query(Task).get(int(kid))
    task.numSubmissions += 1
    task.response = request.json
    db.session.commit()
    return jsonify(task.as_dict())

# CHUNK
# receives a chunk of user interaction data
@api.route('/timelines/<tid>/tasks/<kid>/chunk', methods=['POST'])
def chunk(tid, kid):
    task = db.session.query(Task).get(int(kid))
    chunk = Chunk(**request.json)
    task.chunks.append(chunk)
    db.session.commit()
    return jsonify({'msg': "Stored successfully"}), 201

if __name__ == '__main__':
    app = create_app()
    app.run(processes=3, port=APP_PORT)
