from .journey import Journey
from project import Project
from task import Task
from node import Node
from typing import List


class Task(Node):
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

    def __call__(self, journey: Journey):
        journey.append(self)

