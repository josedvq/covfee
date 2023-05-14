from __future__ import annotations
import datetime
from typing import Dict, Any

import numpy as np
from flask import current_app as app
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column

from .base import Base
from ..tasks.base import BaseCovfeeTask


class TaskResponse(Base):
    """Represents a task's response"""

    __tablename__ = "taskresponses"

    id: Mapped[int] = mapped_column(primary_key=True)

    # instance relationships
    node_id: Mapped[int] = mapped_column(ForeignKey("nodeinstances.id"))
    task: Mapped["TaskInstance"] = relationship(back_populates="responses")
    # node_id = Column(Integer, ForeignKey('nodeinstances.id'))

    state: Mapped[Dict[str, Any]]  # holds the shared state of the task
    submitted: Mapped[bool]
    valid: Mapped[bool]
    # data: Mapped[Dict[str, Any]]
    # created_at = Column(DateTime, default=datetime.datetime.now)
    # updated_at = Column(DateTime, onupdate=datetime.datetime.now)
    # submitted_at = Column(DateTime)

    # can be used to store server state (eg. state of recording)
    # extra: Mapped[Dict[str, Any]]

    def __init__(self):
        super().__init__()
        self.submitted = False
        self.valid = False
        self.state = None

    def to_dict(self):
        response_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}
        response_dict = {**response_dict}
        response_dict[
            "url"
        ] = f'{app.config["API_URL"]}/responses/{response_dict["id"]}'

        return response_dict

    def get_task_object(self):
        task_class = getattr(tasks, self.task.spec.spec["type"], BaseCovfeeTask)
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
            if self.task.spec.spec.get("id", False):
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
        self.valid = validation_result == True
        self.task.has_unsubmitted_response = False

        res = {"status": "success", "valid": self.valid, "response": self.to_dict()}

        if not self.valid:
            res["reason"] = validation_result

        return res
