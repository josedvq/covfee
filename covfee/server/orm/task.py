import datetime
import json
import os
import sys
from io import BytesIO
from typing import Any, Tuple

import numpy as np
from flask import current_app as app
from sqlalchemy.orm import backref

from .db import db
from .. import tasks
from ..tasks.base import BaseCovfeeTask
from ..utils.packer import Packer
pytype = type


class TaskSpec(db.Model):
    """ Represents a task specification.
        Task specifications include the user-provided params (spec) for the task. It can be divided into:
            - Task-specific specification (spec), defined on the task's Typescript interface.
            - Generic task options: required, prerrequisite, maxSubmissions, autoSubmit, timer. These apply to all tasks.
            - Task children (children), recursively defined (points to the same table).
     """
    __tablename__ = 'taskspecs'
    id = db.Column(db.Integer, primary_key=True)
    parent_id = db.Column(db.Integer, db.ForeignKey('taskspecs.id'))
    # backref parent

    children = db.relationship("TaskSpec", backref=backref('parent', remote_side=[id]),
                               cascade="all, delete")
    tasks = db.relationship("Task", backref="spec", cascade="all, delete")

    required = db.Column(db.Boolean)
    prerequisite = db.Column(db.Boolean)
    order = db.Column(db.Integer)
    editable = db.Column(db.Boolean)
    spec = db.Column(db.JSON)
    config = db.Column(db.JSON)

    created_at = db.Column(db.DateTime, default=datetime.datetime.now)
    updated_at = db.Column(db.DateTime, onupdate=datetime.datetime.now)

    def __init__(self, maxSubmissions=0, autoSubmit=False, timer=None,
                 editable=False, required=False, prerequisite=False, shared=False, **spec):
        self.editable = editable
        self.required = required
        self.prerequisite = prerequisite
        self.config = {
            'maxSubmissions': maxSubmissions,
            'autoSubmit': autoSubmit,
            'timer': timer,
            'shared': shared
        }

        if 'children' in spec:
            for child in spec['children']:
                child_spec = TaskSpec(**child)
                self.children.append(child_spec)
            del spec['children']

        self.spec = spec

    def instantiate(self):
        # return singleton task for shared tasks
        if self.config['shared'] and len(self.tasks) > 0:
            return self.tasks[0]

        task = Task()
        self.tasks.append(task)

        if(self.children):
            for child in self.children:
                task.children.append(child.instantiate())
        return task

    def as_dict(self):
        spec_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns
                     if c not in ['responses']}

        spec_dict = {**spec_dict, **spec_dict['config']}
        del spec_dict['config']
        return spec_dict


class Task(db.Model):
    """ A Task is an instantiation of a TaskSpec, associated to a HitInstance.
        It represents a task to be solved within a hit instance.
    """
    __tablename__ = 'tasks'

    id = db.Column(db.Integer, primary_key=True)
    parent_id = db.Column(db.Integer, db.ForeignKey('tasks.id'))
    # backref parent
    hitinstance_id = db.Column(db.LargeBinary, db.ForeignKey('hitinstances.id'))
    # backref hitinstance
    taskspec_id = db.Column(db.Integer, db.ForeignKey('taskspecs.id'))
    # backref spec

    responses = db.relationship("TaskResponse", backref='task', cascade="all, delete-orphan")
    children = db.relationship("Task", backref=backref('parent', remote_side=[id]),
                               cascade="all, delete-orphan")

    # response status
    has_unsubmitted_response = db.Column(db.Boolean)
    created_at = db.Column(db.DateTime, default=datetime.datetime.now)
    updated_at = db.Column(db.DateTime, onupdate=datetime.datetime.now)

    def __init__(self):
        self.has_unsubmitted_response = False
        self.add_response() # add initial empty response

    def get_task_object(self):
        task_class = getattr(tasks, self.spec.spec['type'], BaseCovfeeTask)
        task_object = task_class(task=self)
        return task_object

    def as_dict(self):
        # merge task and spec dicts
        task_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns
                     if c not in ['responses']}
        if task_dict['hitinstance_id']:   # child tasks may have no hitinstance_id
            task_dict['hitinstance_id'] = task_dict['hitinstance_id'].hex()
        spec_dict = self.spec.as_dict()

        task_dict = {**spec_dict, **task_dict}

        task_dict['responses'] = [response.as_dict() for response in self.responses]
        # task is valid if any response is valid
        task_dict['valid'] = self.has_valid_response()
        if self.children:
            task_dict['children'] = [child.as_dict() for child in self.children]
        else:
            task_dict['children'] = []
        task_dict['num_submissions'] = sum([1 if res.submitted else 0 for res in self.responses])
        task_dict['url'] = f'{app.config["API_URL"]}/tasks/{task_dict["id"]}'

        task_object = self.get_task_object()
        task_dict['taskSpecific'] = task_object.get_task_specific_props()

        return task_dict

    def has_valid_response(self):
        return any([response.valid for response in self.responses])

    def add_response(self):
        response = TaskResponse()
        self.responses.append(response)
        return response

    def stream_download(self, z, base_path, index, csv=False):
        responses = [resp for resp in self.responses if resp.submitted]

        for i, response in enumerate(responses):
            if csv:
                # write the CSV data
                df = response.get_dataframe()
                if df is not None:
                    stream = BytesIO()
                    df.to_csv(stream, mode='wb')
                    stream.seek(0)
                    z.write_iter(os.path.join(base_path, response.get_download_filename(task_index=index, response_index=i) + '.csv'),
                                stream)

            # write the json response
            response_dict = response.get_json(
                with_chunk_data=not csv)   # important
            stream = BytesIO()
            stream.write(json.dumps(response_dict).encode())
            stream.seek(0)
            z.write_iter(os.path.join(base_path, response.get_download_filename(task_index=index, response_index=i) + '.json'),
                         stream)

            yield from z.flush()
        
        for child in self.children:
            yield from child.stream_download(z, base_path, csv)


class TaskResponse(db.Model):
    """ Represents a task's response """
    __tablename__ = 'taskresponses'

    id = db.Column(db.Integer, primary_key=True)
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id'))
    # backref task

    chunks = db.relationship("Chunk", backref='taskresponse',
                             order_by="Chunk.index", cascade="all, delete-orphan", lazy="dynamic")

    state = db.Column(db.JSON) # holds the shared state of the task

    submitted = db.Column(db.Boolean)
    valid = db.Column(db.Boolean)
    data = db.Column(db.JSON)

    created_at = db.Column(db.DateTime, default=datetime.datetime.now)
    updated_at = db.Column(db.DateTime, onupdate=datetime.datetime.now)
    submitted_at = db.Column(db.DateTime)

    # can be used to store server state (eg. state of recording)
    extra = db.Column(db.JSON)

    def __init__(self):
        self.submitted = False
        self.valid = False
        self.extra = {}

    def as_dict(self):
        response_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}
        response_dict = {**response_dict}
        response_dict['url'] = f'{app.config["API_URL"]}/responses/{response_dict["id"]}'
        del response_dict['extra']
        
        return response_dict

    def get_task_object(self):

        task_class = getattr(tasks, self.task.spec.spec['type'], BaseCovfeeTask)
        task_object = task_class(response=self)
        return task_object

    def get_dataframe(self):
        task_object = self.get_task_object()
        chunk_data, chunk_logs = self.get_ndarray()
        df = task_object.to_dataframe(chunk_data)
        return df

    def get_json(self, with_chunk_data=True):
        task_object = self.get_task_object()
        # if with_chunk_data:
        #     chunk_data, chunk_logs = self.get_ndarray()
        #     task_json = task_object.to_dict(self.data, chunk_data)
        # else:
        #     task_json = task_object.to_dict(self.data, None)
        return task_object.to_dict(with_chunk_data)

    def get_download_filename(self, task_index, response_index):
        if self.task.parent:
            # start with the parent name for children tasks
            return f'{self.task.parent.spec.spec["name"]}-{self.task.spec.spec["name"]}_{response_index:d}'
        else:
            # use the task id if available
            if self.task.spec.spec.get('id', False):
                return f'{task_index}_{self.task.spec.spec["id"]}_{response_index:d}'
            return f'{task_index}_{self.task.spec.spec["name"]}_{response_index:d}'

    def pack_chunks(self):
        chunks = self.chunks.order_by(Chunk.index.desc()).all()
        chunk_bytes = len(chunks).to_bytes(4, sys.byteorder)
        chunk_bytes += b''.join([chunk.data for chunk in chunks])
        return chunk_bytes

    def get_ndarray(self) -> Tuple[np.ndarray, Any]:
        """This method takes care of aggregating a list of binary data chunks into a single numpy array.

        Args:
            data_chunks (list[bytes]): list of chunks as sent from the server. Size of the chunks may vary.

        Returns:
            np.ndarray: single numpy array with the aggregated data
        """
        if not self.chunks.count():
            return None, None

        chunks = [chunk.unpack() for chunk in self.chunks.all()]

        idxs_chunks = list()
        data_chunks = list()
        logs_chunks = list()

        for chunk in chunks:
            data = chunk['data']
            chunk_length = chunk['chunkLength']

            if len(data) % chunk_length != 0:
                raise Exception('Chunk byte length is invalid.')
            bytes_per_record = len(data) // chunk_length

            if (bytes_per_record - 4) % 8 != 0:
                raise Exception(
                    'Number of data bytes per record is not an 8-multiple.')
            datapoints_per_record = (bytes_per_record - 4) // 8
            idxs_chunks.append(np.frombuffer(
                data,
                dtype=np.uint32,
                count=chunk_length,
                offset=0).astype(np.float64).reshape(-1, 1))
            data_chunks.append(np.frombuffer(
                data,
                dtype=np.float64,
                count=chunk_length * datapoints_per_record,
                offset=4 * chunk_length).reshape(-1, datapoints_per_record))
            logs_chunks.append(chunk['logs'])

        idxs = np.vstack(idxs_chunks)
        data = np.vstack(data_chunks)
        assert len(idxs) == len(data)

        return np.hstack([idxs, data]), [l for chunk in logs_chunks for l in chunk]

    def validate(self):
        task_object = self.get_task_object()
        chunk_data, chunk_logs = self.get_ndarray()
        self.valid = task_object.validate(self.data, chunk_data, chunk_logs)
        return self.valid

    def submit(self, response=None):
        
        validation_result = self.validate()
        
        if response is not None:
            self.data = response
        self.submitted = True
        self.submitted_at = datetime.datetime.now()
        self.valid = (validation_result == True)
        self.task.has_unsubmitted_response = False

        res = {
            'status': 'success',
            'valid': self.valid,
            'response': self.as_dict()
        }

        if not self.valid:
            res['reason'] = validation_result

        return res

# represents a chunk of task response (for continuous responses)
class Chunk(db.Model):
    """ Represents a chunk of or partial task response"""
    __tablename__ = 'chunks'

    # (taskresponse, index) must be unique
    index = db.Column(db.Integer, primary_key=True)
    taskresponse_id = db.Column(db.Integer, db.ForeignKey(
        'taskresponses.id'), primary_key=True)
    # ini_time = db.Column(db.Float, index=True)
    # end_time = db.Column(db.Float, index=True)

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

    def unpack(self):
        packer = Packer()
        parsed = packer.parseChunk(self.data)
        return parsed
