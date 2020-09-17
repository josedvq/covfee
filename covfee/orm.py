import os

from flask import Flask
from flask_sqlalchemy import SQLAlchemy

if os.environ['COVFEE_ENV'] == 'production':
    from constants_prod import *
else:
    from constants_dev import *
db = SQLAlchemy()

def bind_app():
    app = Flask(__name__)
    app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {'isolation_level': "READ UNCOMMITTED"}
    app.app_context().push()
    db.init_app(app)
    return db


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

    def showinfo(self):
        txt = f'{self.name}\nID: {self.id.hex():s}\n'
        for tl in self.timelines:
            txt += tl.showinfo()
        return txt

    def __str__(self):
        txt = f'{self.name} - ID: {self.id.hex():s}\n'
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

    def get_api_url(self):
        return f'{API_URL}/timelines/{self.id.hex():s}'

    def showinfo(self):
        return f' - url: {self.get_url()}\n - api: {self.get_api_url()}\n'

    def __str__(self):
        txt = f'{self.get_url()}'
        submitted = [task for task in self.tasks if task.numSubmissions > 0]
        # task_names = [task.name for task in self.tasks]
        txt += f' [ tasks={len(self.tasks):d}, sub={len(submitted):d} ]\n'
        return txt


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

    def __str__(self):
        return f'{self.name} - sub={self.numSubmissions:d}, chunks={len(self.chunks):d}'

    def __repr__(self):
        return str(self)

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
    
    def __str__(self):
        return f' idx={self.index} - sub={self.submission:d}'

    def __repr__(self):
        return str(self)


