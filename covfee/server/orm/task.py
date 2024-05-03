from __future__ import annotations

from pprint import pformat
from typing import Any, Dict, List

from sqlalchemy import event
from sqlalchemy.orm import Mapped, object_session, relationship

from covfee.shared.schemata import schemata

from .. import tasks
from ..tasks.base import BaseCovfeeTask
from . import utils
from .node import NodeInstance, NodeInstanceStatus, NodeSpec
from .response import TaskResponse


class TaskSpec(NodeSpec):
    __mapper_args__ = {
        "polymorphic_identity": "TaskSpec",
    }

    spec: Mapped[Dict[str, Any]]

    def __init__(self, spec=None):
        # split spec into node settings and task spec
        node_schema = schemata.get_definition("BaseNodeSpec")
        if node_schema is None:
            raise RuntimeError("BaseNodeSpec not found in schemata")

        node_properties = node_schema["properties"].keys()

        node_spec = {k: v for k, v in spec.items() if k in node_properties}
        super().__init__(node_spec)
        self.spec = {k: v for k, v in spec.items() if k not in node_properties}

    def instantiate(self):
        instance = TaskInstance()
        self.nodes.append(instance)
        return instance

    def validate(str):
        pass

    def to_dict(self):
        res = super().to_dict()
        # url of the custom API of this task type (if any)
        res["customApiBase"] = f'/custom/{self.spec["type"]}'
        return res

    def __repr__(self):
        pass

    def __str__(self):
        return pformat({"settings": self.settings, "spec": self.spec})


class TaskInstance(NodeInstance):
    __mapper_args__ = {
        "polymorphic_identity": "TaskInstance",
    }

    responses: Mapped[List[TaskResponse]] = relationship(
        back_populates="task", cascade="all, delete-orphan"
    )

    aux: Mapped[Dict[str, Any]]  # auxiliary task specific data

    def __init__(self):
        super().__init__()
        self.aux = {}
        self.add_response()  # add initial empty response

    def __hash__(self):
        if hasattr(self, "id") and self.id is not None:
            return self.id
        else:
            return self._unique_id

    def __eq__(self, other):
        if not isinstance(other, NodeInstance):
            return NotImplemented
        return hash(self) == hash(other)

    def reset_annotated_data(self):
        for annotation in self.annotations:
            annotation.reset_data()

    def get_task_object(self):
        task_class = getattr(tasks, self.spec.spec["type"], BaseCovfeeTask)
        task_object = task_class(task=self, session=object_session(self))
        return task_object

    def to_dict(self):
        task_dict = {
            **super().to_dict(),
            "responses": [response.to_dict() for response in self.responses],
            "taskSpecific": self.get_task_object().get_task_specific_props(),
        }

        return task_dict

    def has_valid_response(self):
        return any([response.valid for response in self.responses])

    def add_response(self):
        response = TaskResponse()
        self.responses.append(response)
        self.status = NodeInstanceStatus.INIT
        return response

    def make_status_payload(self, prev_status: NodeInstanceStatus = None):
        if prev_status is None:
            prev_status = self.status
        return {
            "id": self.id,
            "hit_id": self.hit_id.hex(),
            "prev": prev_status,
            "new": self.get_masked_status(),
            "manual": self.manual,
            "response_id": self.responses[-1].id,
            "journeys": self.make_journey_status_dict(),
            "dt_start": utils.datetime_to_str(self.dt_start),
            "dt_play": utils.datetime_to_str(self.dt_play),
            "dt_count": utils.datetime_to_str(self.dt_count),
            "dt_pause": utils.datetime_to_str(self.dt_pause),
            "t_elapsed": self.t_elapsed,
            "progress": self.progress,
        }

    def pause(self, pause: bool):
        super().pause(pause)
        self.paused = pause
        self.get_task_object().on_admin_pause()

    def make_results_dict(self):
        results_list = []
        for response in self.responses:
            result_dict = response.make_results_dict()

            result_dict["annotations"] = [
                utils.NoIndentJSON(annotation.data_json)
                for annotation in self.annotations
                if annotation.data_json is not None
            ]

            prolific_ids = []
            for journey in self.journeys:
                annotator = journey.annotator
                if annotator is not None and annotator.prolific_id is not None:
                    prolific_ids.append(annotator.prolific_id)
            result_dict["prolific_id"] = prolific_ids

            results_list.append(result_dict)

        return {"responses": results_list}


# after a TaskInstance is inserted, we attach its
@event.listens_for(TaskInstance, "after_insert")
def create_permissions(mapper, connection, instance: TaskInstance):
    obj = instance.get_task_object()
    obj.on_create()
