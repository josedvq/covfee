import datetime
import json
import os
import sys
from io import BytesIO
from typing import Any

import numpy as np
from flask import current_app as app
from sqlalchemy.orm import backref

from .db import db
from .. import tasks
from ..tasks.base import BaseCovfeeTask
from ..utils.packer import Packer
pytype = type


class TaskSpec(db.Model):
    """ Represents a task specification """
    __tablename__ = 'taskspecs'
    id = db.Column(db.Integer, primary_key=True)
    parent_id = db.Column(db.Integer, db.ForeignKey('taskspecs.id'))
    # backref parent

    children = db.relationship("TaskSpec", backref=backref('parent', remote_side=[id]),
                               cascade="all, delete")
    tasks = db.relationship("Task", backref="spec", cascade="all, delete")

    prerequisite = db.Column(db.Boolean)
    order = db.Column(db.Integer)
    editable = db.Column(db.Boolean)
    spec = db.Column(db.JSON)
    config = db.Column(db.JSON)

    def __init__(self, maxSubmissions=0, autoSubmit=False, timer=None,
                 editable=False, prerequisite=False, **spec):
        self.editable = editable
        self.prerequisite = prerequisite
        self.config = {
            maxSubmissions: maxSubmissions,
            autoSubmit: autoSubmit,
            timer: timer
        }

        if 'children' in spec:
            for child in spec['children']:
                child_spec = TaskSpec(**child)
                self.children.append(child_spec)
            del spec['children']

        self.spec = spec

    def instantiate(self):
        task = Task()
        self.tasks.append(task)

        if(self.children):
            for child in self.children:
                task.children.append(child.instantiate())
        return task

    def as_dict(self):
        spec_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns
                     if c not in ['responses']}

        return spec_dict


class Task(db.Model):
    """ Represents a single task, like eg. annotating one video """
    __tablename__ = 'tasks'

    id = db.Column(db.Integer, primary_key=True)
    parent_id = db.Column(db.Integer, db.ForeignKey('tasks.id'))
    # backref parent
    hitinstance_id = db.Column(db.LargeBinary, db.ForeignKey('hitinstances.id'))
    # backref hitinstances
    taskspec_id = db.Column(db.Integer, db.ForeignKey('taskspecs.id'))
    # backref spec

    responses = db.relationship("TaskResponse", backref='task', cascade="all, delete-orphan",
                                order_by="desc(TaskResponse.index)")
    children = db.relationship("Task", backref=backref('parent', remote_side=[id]),
                               cascade="all, delete-orphan")

    # response status
    has_unsubmitted_response = db.Column(db.Boolean)
    created_at = db.Column(db.DateTime, default=datetime.datetime.now)
    updated_at = db.Column(db.DateTime, onupdate=datetime.datetime.now)

    def __init__(self):
        self.has_unsubmitted_response = False

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

        return task_dict

    def has_valid_response(self):
        return any([response.valid for response in self.responses])

    def add_response(self, index):
        response = TaskResponse(index=index)
        self.responses.append(response)
        return response

    def stream_download(self, z, base_path, csv=False):
        responses = [resp for resp in self.responses if resp.submitted]

        for response in responses:
            if csv:
                # write the CSV data
                df = response.get_dataframe()
                stream = BytesIO()
                df.to_csv(stream, mode='wb')
                stream.seek(0)
                z.write_iter(os.path.join(base_path, response.get_download_filename() + '.csv'),
                             stream)

            # write the json response
            response_dict = response.get_json(
                with_chunk_data=not csv)   # important
            stream = BytesIO()
            stream.write(json.dumps(response_dict).encode())
            stream.seek(0)
            z.write_iter(os.path.join(base_path, response.get_download_filename() + '.json'),
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

    # for numbering multiple response submissions
    index = db.Column(db.Integer)
    submitted = db.Column(db.Boolean)
    valid = db.Column(db.Boolean)
    data = db.Column(db.JSON)
    has_chunk_data = db.Column(db.Boolean)

    task_object = None

    def __init__(self, index, submitted=False, data=None, chunks=[]):
        self.index = index
        self.submitted = submitted
        self.data = data
        self.chunks = chunks

    def as_dict(self):
        response_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}
        return response_dict

    def get_task_object(self):
        if self.task_object:
            return self.task_object

        task_class = getattr(tasks, self.task.spec.spec['type'], BaseCovfeeTask)
        self.task_object = task_class(self)
        return self.task_object

    def get_dataframe(self):
        task_object = self.get_task_object()
        chunk_data = self.get_ndarray()
        df = task_object.to_dataframe(chunk_data)
        return df

    def get_json(self, with_chunk_data=True):
        task_object = self.get_task_object()
        if with_chunk_data:
            chunk_data = self.get_ndarray()
            task_json = task_object.to_dict(self.data, chunk_data)
        else:
            task_json = task_object.to_dict(self.data, None)
        return task_json

    def get_download_filename(self):
        return f'{self.task.spec.spec["name"]}_{self.index:d}'

    def pack_chunks(self):
        chunks = self.chunks.order_by(Chunk.index.desc()).all()
        chunk_bytes = len(chunks).to_bytes(4, sys.byteorder)
        chunk_bytes += b''.join([chunk.data for chunk in chunks])
        return chunk_bytes

    def get_ndarray(self) -> (np.ndarray, Any):
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
                raise Exception('Chunk byte length is not.')
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

    def submit(self, response):
        task_object = self.get_task_object()
        chunk_data, chunk_logs = self.get_ndarray()
        validation_result = task_object.validate(response, chunk_data, chunk_logs)
        
        self.data = response
        self.submitted = True
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

db.Index('taskresponse_index', TaskResponse.task_id, TaskResponse.index)


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
