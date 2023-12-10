from typing import Any, List
import random
from pprint import pformat

import covfee.launcher as launcher
from covfee.server.orm import (
    TaskSpec as OrmTask,
    JourneySpec as OrmJourney,
    HITSpec as OrmHit,
    Project as OrmProject,
)
from covfee.shared.schemata import schemata
from covfee.logger import logger
from covfee.server.orm.condition_parser import parse_expression


class PostInitCaller(type):
    def __call__(cls, *args, **kwargs):
        obj = type.__call__(cls, *args, **kwargs)
        obj.__post_init__()
        return obj


class BaseDataclass:
    pass


class CovfeeTask(BaseDataclass, metaclass=PostInitCaller):
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
        logger.debug(f"Created ORM task: {str(self._orm_task)}")
        return self._orm_task

    def __post_init__(self):
        for cond in ["start", "stop", "pause"]:
            expression = getattr(self, cond, None)
            if expression is not None:
                try:
                    parse_expression(expression)
                except Exception as ex:
                    raise ValueError(f'Invalid {cond} condition "{expression}"')


class Journey(BaseDataclass):
    def __init__(self, nodes=None, name: str = None):
        super().__init__()
        self.nodes = nodes if nodes is not None else list()
        self.name = name

    def orm(self):
        journey = OrmJourney([n.orm() for n in self.nodes])
        logger.debug(f"Created ORM journey: {str(journey)}")
        return journey


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
        hit = OrmHit(self.name, [j.orm() for j in self.journeys])
        logger.debug(f"Created ORM HIT: {str(hit)}")
        return hit


class Project(BaseDataclass):
    def __init__(self, name: str, email: str, hits: HIT = None):
        super().__init__()
        self.name = name
        self.email = email
        self.hits = hits if hits is not None else list()

    def orm(self):
        project = OrmProject(self.name, self.email, [h.orm() for h in self.hits])
        logger.debug(f"Created ORM Project: {str(project)}")
        return project


class CovfeeApp(BaseDataclass):
    def __init__(self, projects: List[Project]):
        super().__init__()
        self.projects = projects

    def get_instantiated_projects(self, num_instances=1):
        orm_projects = []
        for p in self.projects:
            orm_project = p.orm()
            for spec in orm_project.hitspecs:
                spec.instantiate(num_instances)
            orm_projects.append(orm_project)
        return orm_projects

    def launch(self, num_instances=1):
        orm_projects = self.get_instantiated_projects(num_instances)
        l = launcher.Launcher("dev", orm_projects, folder=None)
        l.make_database()
        l.launch()
