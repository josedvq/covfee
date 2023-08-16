from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List

from sqlalchemy import false
from covfee.launcher import Launcher
from covfee.server.orm import (
    Project as OrmProject,
    HITSpec as OrmHit,
    TaskSpec as OrmTask,
    JourneySpec as OrmJourney,
)
from covfee.server.rest_api import journeys
from covfee.shared.validator.ajv_validator import AjvValidator


class Block:
    pass


# ajv = AjvValidator()


# @dataclass
# class Project(Block):
#     name: str
#     email: str
#     hits: List[Hit] = field(default_factory=list)

#     # to keep track of info at launch time
#     _conflicts: bool = False
#     _filename: str = None

#     def launch(self, num_instances=1):
#         for spec in self.hitspecs:
#             spec.instantiate(num_instances)
#         l = Launcher.Launcher([self])
#         l.start(mode="dev")

#     def __instantiate(self):
#         return OrmProject()


# @dataclass
# class Hit(Block):
#     name: str

#     journeys: List[Journey]

#     def __instantiate(self):
#         return OrmHit()


# @dataclass
# class Journey(Block):
#     name: str

#     tasks: List[Task]

#     def __instantiate(self):
#         return OrmJourney()


# @dataclass
# class Task(Block):
#     name: str
#     """
#     Name of the task. It is displayed in covfee (eg. "Video 3")
#     """
#     spec: Dict[str, any]
#     """
#     Task specification or configuration
#     """
#     required: bool = false
#     """
#     If true, this node must have a valid submission before the journey can be submitted
#     """
#     prerequisite: bool = false
#     """
#     Node is marked as a prerrequisite
#     Prerrequisite nodes must be completed before the rests of the nodes in the journey are revealed.
#     """
#     max_submissions: int = 1
#     """
#     Maximum number of submissions a user can make for the task.
#     """
#     instructions: str = None
#     """
#     Instructions to be displayed to the user when he opens this task
#     """
#     start: List[Dict[str, Any]]
#     """
#     Conditions to be met for starting the task
#     """
#     stop: List[Dict[str, Any]]
#     """
#     Conditions to be met for stopping the task
#     """

#     def __post_init__(self):
#         # validate task
#         pass

#     def __instantiate(self):
#         return OrmTask()
