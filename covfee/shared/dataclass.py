from typing import Any
import random

import covfee.launcher as launcher
from covfee.server.orm import (
    TaskSpec as OrmTask,
    JourneySpec as OrmJourney,
    HITSpec as OrmHit,
    Project as OrmProject,
)
from covfee.shared.schemata import schemata


class BaseDataclass:
    pass


class CovfeeTask(BaseDataclass):
    def __init__(self):
        super().__init__()
        self._orm_task = None

    def orm(self):
        if self._orm_task is not None:
            return self._orm_task
        spec = {k: v for k, v in self.__dict__.items() if not k.startswith("_")}
        class_vars = {
            k: v for k, v in self.__class__.__dict__.items() if not k.startswith("_")
        }

        self._orm_task = OrmTask({**spec, **class_vars})
        return self._orm_task


class Journey(BaseDataclass):
    def __init__(self, nodes=None):
        super().__init__()
        self.nodes = nodes if nodes is not None else list()

    def orm(self):
        return OrmJourney([n.orm() for n in self.nodes])


class HIT(BaseDataclass):
    def __init__(self, name: str, repeat=1, config: Any = None):
        super().__init__()
        self.name = name
        self.journeys = []
        self.repeat = repeat

        self.config = config

    def add_journey(self, nodes=None):
        j = Journey(nodes)
        self.journeys.append(j)
        return j

    def orm(self):
        return OrmHit(self.name, [j.orm() for j in self.journeys])


class Project(BaseDataclass):
    def __init__(self, name: str, email: str, hits: HIT = None):
        super().__init__()
        self.name = name
        self.email = email
        self.hits = hits if hits is not None else list()

    def orm(self):
        return OrmProject(self.name, self.email, [h.orm() for h in self.hits])

    def launch(self, num_instances=1):
        orm_project = self.orm()
        for spec in orm_project.hitspecs:
            spec.instantiate(num_instances)
        l = launcher.Launcher([orm_project])
        l.start(mode="dev")
