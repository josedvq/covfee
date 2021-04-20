import datetime

from flask import current_app as app

from .db import db
from .. import tasks
from ..tasks.base import BaseCovfeeTask
from sqlalchemy.orm import backref
import sys
pytype = type

class TaskSpec(db.Model):
    """ Represents a task specification """
    __tablename__ = 'taskspecs'
    id = db.Column(db.Integer, primary_key=True)

    name = db.Column(db.String)
    order = db.Column(db.Integer)
    spec = db.Column(db.JSON)
    config = db.Column(db.JSON)
    tasks = db.relationship("Task", backref=backref('spec')

    def __init__(self, name=None, maxSubmissions=0, autoSubmit=False, timer=None, ** spec):
        self.name = name
        self.config={
            maxSubmissions: maxSubmissions,
            autoSubmit: autoSubmit,
            timer: timer
        }
        self.spec = spec

class Task(db.Model):
    """ Represents a single task, like eg. annotating one video """
    __tablename__ = 'tasks'

    id = db.Column(db.Integer, primary_key=True)
    config = db.Column(db.JSON)
    
    responses = db.relationship("TaskResponse", backref='task', cascade="all, delete-orphan")
    parent_id = db.Column(db.Integer, db.ForeignKey('tasks.id'))
    children = db.relationship("Task", backref=backref('parent', remote_side=[id]))
    # backref hitinstances

    # response status
    has_unsubmitted_response = db.Column(db.Boolean)

    created_at = db.Column(db.DateTime, default=datetime.datetime.now)
    updated_at = db.Column(db.DateTime, onupdate=datetime.datetime.now)

    def __init__(self, order=0, name=None, maxSubmissions=0, autoSubmit=False, timer=None, _hit_object=None, ** spec):
        self.order = order
        self.name = name
        

        self.has_unsubmitted_response = False

        # fix URLs
        if 'media' in spec:
            for k, v in spec['media'].items():
                if k[-3:] == 'url':
                    if pytype(v) == list:
                        spec['media'][k] = [app.config['PROJECT_WWW_URL'] + '/' + vi if vi[:4] != 'http' else vi for vi in v]
                    else:
                        spec['media'][k] = app.config['PROJECT_WWW_URL'] + \
                            '/' + v if v[:4] != 'http' else v

        if 'children' in spec:
            for child in spec['children']:
                task = Task(**child)
                self.children.append(task)
                if _hit_object:
                    _hit_object.tasks.append(task)
            del spec['children']

        self.spec = spec

    def as_dict(self, editable=False):
        task_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns if c not in ['responses']}
        task_dict['responses'] = [response.as_dict() for response in self.responses]
        if len(self.children):
            task_dict['children'] = [child.as_dict() for child in self.children]
        task_dict['editable'] = editable
        task_dict['num_submissions'] = sum([1 if res.submitted else 0 for res in self.responses])
        
        return task_dict

    def __str__(self):
        return f'{self.name}: chunks={len(self.chunks):d}'

    def __repr__(self):
        return str(self)


class TaskResponse(db.Model):
    """ Represents a task's response """
    __tablename__ = 'taskresponses'

    id = db.Column(db.Integer, primary_key=True)
    # for numbering multiple response submissions
    index = db.Column(db.Integer)
    submitted = db.Column(db.Boolean)
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id'))
    hitinstance_id = db.Column(db.LargeBinary, db.ForeignKey('hitinstances.id'))
    data = db.Column(db.JSON)
    chunks = db.relationship("Chunk", backref='taskresponse', order_by="Chunk.index", cascade="all, delete-orphan", lazy="dynamic")
    has_chunk_data = db.Column(db.Boolean)
    # backref task

    task_object = None

    def __init__(self, task_id, hitinstance_id, index, submitted=False, data=None, chunks=None):
        self.task_id = task_id
        self.hitinstance_id = hitinstance_id
        self.index = index
        self.submitted = submitted
        self.data = data
        self.chunks = chunks

    def as_dict(self):
        response_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}

        response_dict['hitinstance_id'] = response_dict['hitinstance_id'].hex()
        
        return response_dict

    def get_task_object(self):
        if self.task_object:
            return self.task_object

        task_class = getattr(tasks, self.task.spec['type'], BaseCovfeeTask)
        self.task_object = task_class(self)
        return self.task_object

    def get_dataframe(self):
        task_object = self.get_task_object()
        chunk_data = task_object.aggregate_data_chunks(
            [(chunk.data, chunk.length) for chunk in self.chunks.all()])
        df = task_object.to_dataframe(chunk_data)
        return df

    def get_json(self, with_chunk_data=True):
        task_object = self.get_task_object()
        if with_chunk_data:
            chunk_data = task_object.aggregate_data_chunks(
                [(chunk.data, chunk.length) for chunk in self.chunks.all()])
            task_json = task_object.to_dict(self.data, chunk_data)
        else:
            task_json = task_object.to_dict(self.data, None)
        return task_json

    def get_download_filename(self):
        return f'{self.task.name}_{self.index:d}'

    def pack_chunks(self):
        chunks = self.chunks.order_by(Chunk.index.desc()).all()
        chunk_bytes = len(chunks).to_bytes(4, sys.byteorder)
        chunk_bytes += b''.join([chunk.data for chunk in chunks])
        print([len(chunk.data) for chunk in chunks])
        print((len(chunks), chunk_bytes[:10].hex()))
        return chunk_bytes


db.Index('taskresponse_index', TaskResponse.task_id,
         TaskResponse.hitinstance_id, TaskResponse.index)


# represents a chunk of task response (for continuous responses)
class Chunk(db.Model):
    """ Represents a chunk of or partial task response"""
    __tablename__ = 'chunks'

    # for order-keeping of the chunks
    index = db.Column(db.Integer, primary_key=True)
    # ini_time = db.Column(db.Float, index=True)
    # end_time = db.Column(db.Float, index=True)
    taskresponse_id = db.Column(db.Integer, db.ForeignKey('taskresponses.id'), primary_key=True)
    data = db.Column(db.LargeBinary)
    length = db.Column(db.Integer)   # number of samples in data
    log_data = db.Column(db.JSON, nullable=True)

    def __init__(self, index, data, length, log_data=None):
        self.index = index
        self.update(data, length, log_data)

    def update(self, data, length, log_data=None):
        self.data = data
        self.length = length
        self.log_data = log_data
        # self.ini_time = data[0][0]
        # self.end_time = data[-1][0]

    def as_dict(self):
        chunk_dict = {c.name: getattr(
            self, c.name) for c in self.__table__.columns}
        return chunk_dict

    def __str__(self):
        return f' idx={self.index}'

    def __repr__(self):
        return str(self)
