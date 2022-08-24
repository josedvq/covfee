from __future__ import annotations
import datetime
from typing import Tuple

import numpy as np
from sqlalchemy import (
    Integer,
    JSON,
    Boolean,
    Column, 
    DateTime, 
    ForeignKey)
from sqlalchemy.orm import relationship

from covfee.server.db import Base
from ..tasks.base import BaseCovfeeTask

class TaskResponse(Base):
    """ Represents a task's response """
    __tablename__ = 'taskresponses'

    id = Column(Integer, primary_key=True)

    # instance relationships
    node_id = Column(Integer, ForeignKey('nodeinstances.id'))
    task = relationship("TaskInstance", back_populates='responses')
    

    state = Column(JSON) # holds the shared state of the task
    submitted = Column(Boolean)
    valid = Column(Boolean)
    data = Column(JSON)
    created_at = Column(DateTime, default=datetime.datetime.now)
    updated_at = Column(DateTime, onupdate=datetime.datetime.now)
    submitted_at = Column(DateTime)

    # can be used to store server state (eg. state of recording)
    extra = Column(JSON)

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