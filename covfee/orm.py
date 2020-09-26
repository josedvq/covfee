import os
import json
import copy
from hashlib import sha256

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import covfee.config

db = SQLAlchemy()
app = Flask(__name__)
app.config.from_object('covfee.config')
app.config.from_json(os.path.join(os.path.dirname(os.path.realpath(__file__)), 'covfee.env.json'))
if app.config['FLASK_ENV'] == 'development':
    app.config.from_pyfile(os.path.join(os.getcwd(), 'covfee.development.config.py'), silent=True)
else:
    app.config.from_pyfile(os.path.join(os.getcwd(), 'covfee.production.config.py'))
app.app_context().push()
db.init_app(app)

class Project(db.Model):
    """ Represents a set of timelines which make up an experiment or annotation project """
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

    def info(self):
        txt = f'{self.name}\nID: {self.id.hex():s}\n'
        for tl in self.timelines:
            txt += tl.showinfo()
        return txt

    def __str__(self):
        txt = f'{self.name} - ID: {self.id.hex():s}\n'
        for tl in self.timelines:
            txt += str(tl)
        return txt

    @staticmethod
    def from_dict(proj_dict: dict):
        proj_dict = copy.deepcopy(proj_dict)
        project = copy.deepcopy(proj_dict)
        proj_json = json.dumps(project)
        timelines = list()
        for i, timeline_dict in enumerate(project['timelines']):
            num_timelines = timeline_dict.get('repeat', 1)
            if 'repeat' in timeline_dict:
                del timeline_dict['repeat']

            # insert multiple timelines according to the repeat param
            timeline_urls = []
            for j in range(num_timelines):
                timeline = timeline_dict.copy()
                tasks = list()
                for task_dict in timeline['tasks']:
                    tasks.append(Task(**task_dict))
                timeline['tasks'] = tasks
                hash_id = sha256(f'{proj_json}_{i:d}_{j:d}'.encode()).digest()
                timeline = Timeline(id=hash_id, **timeline)
                timeline_urls.append(timeline.get_url())
                timelines.append(timeline)
            proj_dict['timelines'][i]['urls'] = timeline_urls

        project['timelines'] = timelines
        hash_id = sha256(json.dumps(proj_json).encode()).digest()
        project = Project(id=hash_id, **project)
        return project, proj_dict

    @staticmethod
    def from_json(fpath: str):
        '''
        Loads a project into ORM objects from a project json file.
        '''
        with open(fpath, 'r') as f:
            proj_dict = json.load(f)

        return Project.from_dict(proj_dict)


class Timeline(db.Model):
    """ Represents a set of tasks to be completed by one subject, ie. a HIT """
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
        self.tasks = tasks
        self.submitted = submitted

        # fix URLs
        if media is not None:
            for k, v in media.items():
                if k[-3:] == 'url' and v[:4] != 'http':
                    media[k] = app.config['MEDIA_URL'] + '/' + v

        self.media = media

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
            return f'{app.config["APP_URL"]}/#/continuous-annotation/{self.id.hex():s}'
        else:
            return f'{app.config["APP_URL"]}/#/timelines/{self.id.hex():s}'

    def get_api_url(self):
        return f'{app.config["API_URL"]}/timelines/{self.id.hex():s}'

    def showinfo(self):
        return f' - url: {self.get_url()}\n - api: {self.get_api_url()}\n'

    def __str__(self):
        txt = f'{self.get_url()}'
        submitted = [task for task in self.tasks if task.numSubmissions > 0]
        # task_names = [task.name for task in self.tasks]
        txt += f' [ tasks={len(self.tasks):d}, sub={len(submitted):d} ]\n'
        return txt


class Task(db.Model):
    """ Represents a single task, like eg. annotating one video """
    __tablename__ = 'tasks'

    id = db.Column(db.Integer, primary_key=True)
    timeline_id = db.Column(db.Integer, db.ForeignKey('timelines.id'))
    type = db.Column(db.String)
    name = db.Column(db.String)
    text = db.Column(db.String)
    media = db.Column(db.JSON)
    numSubmissions = db.Column(db.Integer)
    form = db.Column(db.JSON)
    response = db.Column(db.JSON)

    chunks = db.relationship("Chunk", backref='task')

    def __init__(self, type, name=None, text=None, media=None, form=None, numSubmissions=0):
        self.type = type
        self.name = name
        self.text = text
        self.form = form
        self.numSubmissions = numSubmissions

        # fix URLs
        if media is not None:
            for k, v in media.items():
                if k[-3:] == 'url' and v[:4] != 'http':
                    media[k] = app.config['MEDIA_URL'] + '/' + v

        self.media = media

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
    """ Represents a chunk of data, in response to a task. Used for continuous tasks that must persist data chunks. """
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


