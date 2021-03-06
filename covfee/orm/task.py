import json
import datetime

from .orm import db, app
from .. import tasks
import os

class Task(db.Model):
    """ Represents a single task, like eg. annotating one video """
    __tablename__ = 'tasks'

    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String)
    order = db.Column(db.Integer)
    name = db.Column(db.String)
    props = db.Column(db.JSON)
    responses = db.relationship("TaskResponse", backref='task', cascade="all, delete-orphan")
    # backref hits
    # backref hitinstances

    created_at = db.Column(db.Date, default=datetime.datetime.now)
    updated_at = db.Column(db.Date, onupdate=datetime.datetime.now)

    def __init__(self, type, order=0, name=None, **props):
        self.type = type
        self.order = order
        self.name = name

        # fix URLs
        if 'media' in props:
            for k, v in props['media'].items():
                if k[-3:] == 'url' and v[:4] != 'http':
                    props['media'][k] = app.config['MEDIA_URL'] + '/' + v

        self.props = props

    def as_dict(self, editable=False):
       task_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns if c != 'props'}
       task_dict = {**task_dict, **self.props}
       task_dict['editable'] = editable
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
    hitinstance_id = db.Column(db.Binary, db.ForeignKey('hitinstances.id'))
    data = db.Column(db.JSON)
    chunks = db.relationship("Chunk", backref='taskresponse', order_by="Chunk.index", cascade="all, delete-orphan")

    def __init__(self, task_id, hitinstance_id, index, submitted=False, data=None, chunks=None):
        self.task_id = task_id
        self.hitinstance_id = hitinstance_id
        self.index = index
        self.submitted = submitted
        self.data = data
        self.chunks = chunks

    def as_dict(self, with_chunk_data=False):
        response_dict = {c.name: getattr(self, c.name)
            for c in self.__table__.columns}

        response_dict['hitinstance_id'] = response_dict['hitinstance_id'].hex()
        if with_chunk_data:
            response_dict['chunk_data'] = self.aggregate()['data']

        return response_dict

    def aggregate(self):
        # apply task-specific aggregation method
        if hasattr(tasks, self.task.type):
            task_class = getattr(tasks, self.task.type)
            chunk_data = [chunk.data for chunk in self.chunks]
            return task_class.process_response(self.data, chunk_data, self.hitinstance, self.task)
        else:
            # default aggregation
            return {
                'result': self.data,
                'data': [x for y in self.chunks for x in y.data]
            }

    def write_json(self, dirpath):
        fpath = os.path.join(dirpath, f'{self.task.name}_{self.index:d}.json')
        processed_response = self.aggregate()
        if processed_response is None:
            return False

        json.dump(processed_response, open(fpath, 'w'))
        return True

    def write_csv(self, dirpath):
        if not hasattr(tasks, self.task.type):
            return False
        
        processed_response = self.aggregate()
        if processed_response is None:
            return False
        
        fpath = os.path.join(dirpath, f'{self.task.name}_{self.index:d}.csv')
        task_class = getattr(tasks, self.task.type)
        df = task_class.to_dataframe(processed_response)
        df.to_csv(fpath)
        return True

db.Index('taskresponse_index', TaskResponse.task_id,
      TaskResponse.hitinstance_id, TaskResponse.index)

# represents a chunk of task response (for continuous responses)
class Chunk(db.Model):
    """ Represents a chunk of or partial task response"""
    __tablename__ = 'chunks'

    # for order-keeping of the chunks
    index = db.Column(db.Integer, primary_key=True)
    taskresponse_id = db.Column(db.Integer, db.ForeignKey(
        'taskresponses.id'), primary_key=True)
    data = db.Column(db.JSON)

    def __init__(self, index, data):
        self.index = index
        self.data = data

    def __str__(self):
        return f' idx={self.index}'

    def __repr__(self):
        return str(self)
