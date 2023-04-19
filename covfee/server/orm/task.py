from __future__ import annotations
import datetime
import json
import os
import sys
from io import BytesIO
from typing import Any, Dict, List, TYPE_CHECKING

import numpy as np
from flask import current_app as app
from sqlalchemy import (
    JSON)
from sqlalchemy.orm import backref, relationship, Mapped

from .base import Base
from .response import TaskResponse
from .. import tasks
from ..tasks.base import BaseCovfeeTask
from ..utils.packer import Packer

from .node import NodeSpec, NodeInstance

class TaskSpec(NodeSpec):

    __mapper_args__ = {
        "polymorphic_identity": "TaskSpec",
    }

    spec: Mapped[Dict[str, Any]]

    def __init__(self, spec=None):
        super().__init__()
        self.spec = spec

    def instantiate(self):
        instance = TaskInstance()
        self.nodes.append(instance)
        return instance

    def validate(str):
        pass
   
    def __repr__(self):
        pass

    
class TaskInstance(NodeInstance):

    __mapper_args__ = {
        "polymorphic_identity": "TaskInstance",
    }


    responses: Mapped[List['TaskResponse']] = relationship(back_populates='task', cascade="all, delete-orphan")

    # response status
    # created_at = Column(DateTime, default=datetime.datetime.now)
    # updated_at = Column(DateTime, onupdate=datetime.datetime.now)

    def __init__(self):
        super().__init__()
        self.has_unsubmitted_response = False
        self.add_response() # add initial empty response

    def __hash__(self):
        if hasattr(self, 'id') and self.id is not None:
            return self.id
        else:
            return self._unique_id
        
    def __eq__(self, other):
        if not isinstance(other, NodeInstance):
            return NotImplemented
        return hash(self) == hash(other)

    def get_task_object(self):
        task_class = getattr(tasks, self.spec.spec['type'], BaseCovfeeTask)
        task_object = task_class(task=self)
        return task_object

    def to_dict(self):
        # merge task and spec dicts
        task_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns
                     if c not in ['responses']}
        spec_dict = self.spec.to_dict()

        task_dict = {**spec_dict, **task_dict}

        task_dict['responses'] = [response.to_dict() for response in self.responses]
        # task is valid if any response is valid
        # task_dict['valid'] = self.has_valid_response()

        # task_dict['num_submissions'] = sum([1 if res.submitted else 0 for res in self.responses])
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


