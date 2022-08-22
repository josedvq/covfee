from __future__ import annotations
import datetime
import json
import os
import sys
from io import BytesIO
from typing import Any, Tuple, TYPE_CHECKING

import numpy as np
from flask import current_app as app
from sqlalchemy import (
    Boolean,
    Integer,
    Column, 
    LargeBinary, 
    DateTime, 
    ForeignKey)
from sqlalchemy.orm import backref, relationship

from ..db import Base
from .. import tasks
from ..tasks.base import BaseCovfeeTask
from ..utils.packer import Packer
pytype = type

from .node import NodeSpec, NodeInstance
if TYPE_CHECKING:
    from .journey import JourneySpec

class TaskSpec(NodeSpec):

    def __init__(self, spec=None):
        super().__init__()
        self.spec = spec

    @property
    def spec(self):
        return self.__spec

    @spec.setter
    def spec(self, val):
        self.__spec = val

    def validate(str):
        pass
   
    def __repr__(self):
        pass

    def __call__(self, journey: JourneySpec):
        journey.append(self)
        return journey

class TaskInstance(NodeInstance):

    responses = relationship("Response", back_populates='task', cascade="all, delete-orphan")

    # response status
    created_at = Column(DateTime, default=datetime.datetime.now)
    updated_at = Column(DateTime, onupdate=datetime.datetime.now)

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


