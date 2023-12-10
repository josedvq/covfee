from __future__ import annotations
import datetime
from typing import TYPE_CHECKING, Dict, Any, Optional

import numpy as np
from flask import current_app as app
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column

from covfee.server.orm.node import NodeInstanceStatus

from .. import tasks
from .base import Base
from ..tasks.base import BaseCovfeeTask

if TYPE_CHECKING:
    from .task import TaskInstance


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

    created_at: Mapped[datetime.datetime] = mapped_column(default=datetime.datetime.now)
    updated_at: Mapped[datetime.datetime] = mapped_column(
        default=datetime.datetime.now, onupdate=datetime.datetime.now
    )
    created_at: Mapped[Optional[datetime.datetime]]

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
        response_dict = super().to_dict()
        response_dict = {**response_dict}
        response_dict[
            "url"
        ] = f'{app.config["API_URL"]}/responses/{response_dict["id"]}'

        return response_dict

    def get_dataframe(self):
        task_object = self.get_task_object()
        chunk_data, chunk_logs = self.get_ndarray()
        df = task_object.to_dataframe(chunk_data)
        return df

    def get_json(self, with_chunk_data=True):
        task_object = self.get_task_object()
        return task_object.to_dict(with_chunk_data)

    def validate(self):
        task_object = self.task.get_task_object()
        self.valid = task_object.validate(self)
        return self.valid

    def submit(self, response=None):
        valid, reason = self.validate()

        if response is not None:
            self.state = response["state"]
        self.submitted = True
        self.submitted_at = datetime.datetime.now()
        self.valid = valid
        self.task.status = NodeInstanceStatus.FINISHED

        res = {"status": "success", "valid": self.valid, "response": self.to_dict()}

        if not self.valid:
            res["reason"] = reason

        return res

    def make_results_dict(self):
        return {
            "created": str(self.created_at),
            "submitted": str(self.submitted),
            "state": self.state,
        }
