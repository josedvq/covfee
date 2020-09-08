# from sqlalchemy.orm import sessionmaker
# from sqlalchemy import create_engine
import json
import os
import glob
from hashlib import sha256

from flask import Flask, Response, render_template, request, jsonify, Blueprint, send_from_directory
from flask_cors import cross_origin, CORS
from flask_sqlalchemy import SQLAlchemy
app = Flask(__name__, static_folder=None)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
db = SQLAlchemy(app)
if os.environ['COVFEE_ENV'] == 'production':
    from constants_prod import *
else:
    from constants_dev import *

class Project(db.Model):
    __tablename__ = 'projects'

    id = db.Column(db.Binary, primary_key=True)
    name = db.Column(db.String)
    email = db.Column(db.String)
    timelines = db.relationship("Timeline", backref="project")

    def __init__(self, id, name, email, timelines):
        self.id = id
        self.name = name
        self.email = email
        self.timelines = timelines

    def as_dict(self):
       project_dict = {c.name: getattr(self, c.name)
                       for c in self.__table__.columns}
       project_dict['id'] = project_dict['id'].hex()
       return project_dict

    def __str__(self):
        txt = f'{self.name}\nID: {self.id.hex():s}\n'
        for tl in self.timelines:
            txt += str(tl)
        return txt


class Timeline(db.Model):
    __tablename__ = 'timelines'

    id = db.Column(db.Binary, primary_key=True)
    type = db.Column(db.String)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'))
    media = db.Column(db.JSON)
    tasks = db.relationship("Task", backref='timeline')
    submitted = db.Column(db.Boolean)

    def __init__(self, id, type, tasks, media=None, submitted=False):
        self.id = id
        self.type = type
        self.media = media
        self.tasks = tasks
        self.submitted = submitted

    def as_dict(self, with_tasks=False):
        timeline_dict = {c.name: getattr(self, c.name)
                         for c in self.__table__.columns}
        if with_tasks:
            timeline_dict['tasks'] = {task.id: task.as_dict()
                                      for task in self.tasks}
        timeline_dict['id'] = timeline_dict['id'].hex()
        timeline_dict['project'] = self.project.as_dict()
        del timeline_dict['project_id']

        if self.submitted:
            timeline_dict['completion_code'] = sha256(
                (self.id.hex() + '2208').encode()).digest().hex()[:12]

        return timeline_dict

    def get_url(self):
        if self.type == 'annotator':
            return f'{APP_URL}/#/continuous-annotation/{self.id.hex():s}'
        else:
            return f'{APP_URL}/#/timelines/{self.id.hex():s}'

    def __str__(self):
        return f' - url: {self.get_url()}\n'


class Task(db.Model):
    __tablename__ = 'tasks'

    id = db.Column(db.Integer, primary_key=True)
    timeline_id = db.Column(db.Integer, db.ForeignKey('timelines.id'))
    type = db.Column(db.String)
    name = db.Column(db.String)
    media = db.Column(db.JSON)
    numSubmissions = db.Column(db.Integer)
    form = db.Column(db.JSON)
    response = db.Column(db.JSON)

    chunks = db.relationship("Chunk", backref='task')

    def __init__(self, type, name=None, media=None, form=None, numSubmissions=0):
        self.type = type
        self.name = name
        self.media = media
        self.form = form
        self.numSubmissions = numSubmissions

    def as_dict(self):
       task_dict = {c.name: getattr(self, c.name)
                    for c in self.__table__.columns}
       task_dict['timeline_id'] = task_dict['timeline_id'].hex()
       return task_dict

# represents a chunk of a task
class Chunk(db.Model):
    __tablename__ = 'chunks'

    id = db.Column(db.Integer, primary_key=True)
    index = db.Column(db.Integer)
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id'))
    submission = db.Column(db.Integer)
    data = db.Column(db.JSON)

    def __init__(self, index, data, submission=None):
        self.index = index
        self.data = data
        self.submission = submission


cors = CORS(app, resources={r"/*": {"origins": "*"}})

# APP ROUTES
@app.route('/')
def main():
    return render_template('app.html', api_url=API_URL, bundle_url=BUNDLE_URL)

@app.route('/static/<path:filename>')
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

app.register_blueprint(api, url_prefix='/api')

if __name__ == '__main__':
    app.run(processes=3, port=APP_PORT)
