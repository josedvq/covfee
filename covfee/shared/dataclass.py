from typing import Any, List, Tuple, Optional

import covfee.launcher as launcher
from covfee.logger import logger
from covfee.server.orm import (
    HITSpec as OrmHit,
)
from covfee.server.orm import (
    JourneySpec as OrmJourney,
)
from covfee.server.orm import (
    Project as OrmProject,
)
from covfee.server.orm import (
    TaskSpec as OrmTask,
)


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
        self._player_count = -1

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

    def _count(self):
        self._player_count += 1
        return self._player_count

    def __post_init__(self):
        pass
        # TODO: check alert conditions
        # expression = getattr(self, cond, None)
        # if expression is not None:
        #     try:
        #         parse_expression(expression)
        #     except Exception as ex:
        #         raise ValueError(f'Invalid {cond} condition "{expression}"')


class Journey(BaseDataclass):
    name: str
    global_unique_id: Optional[str]
    nodes_players: List[Tuple[CovfeeTask, int]]

    def __init__(
        self,
        nodes: List[CovfeeTask] = None,
        name: str = None,
        global_unique_id: Optional[str] = None,
    ):
        """
        Specifies a journey

        Parameters:
        nodes (list[CovfeeTask]): The tasks that a study participant will go through for this journey.
        name (str): A human readable name.
        global_unique_id (Optional[str]): A globally unique identifier for the Journey. Serves to create persistency
                                          in the database across multiple launches of "covfee make" and therefore,
                                          be able to add more hits/journeys into an existing database.
                                          It is expected to be unique even across different projects and it is
                                          responsibility of the study administrator to define a naming pattern.
        """
        super().__init__()
        if nodes is not None:
            self.nodes_players = [(n, n._count()) for n in nodes]
        else:
            self.nodes_players: List[Tuple[CovfeeTask, int]] = list()
        self.name = name
        self.id_within_study = global_unique_id

    def orm(self):
        journey = OrmJourney([(n.orm(), p) for n, p in self.nodes_players])
        journey.id_within_study = self.id_within_study
        logger.debug(f"Created ORM journey: {str(journey)}")
        return journey

    def add_node(self, node: CovfeeTask, player: int = None):
        self.nodes_players.append((node, player))

    extend = add_node


class HIT(BaseDataclass):
    name: str
    repeat: int
    config: Any
    journeys: List[Journey]
    global_unique_id: Optional[str]

    def __init__(
        self,
        name: str,
        repeat: int = 1,
        config: Any = None,
        global_unique_id: Optional[str] = None,
    ):
        """
        Specifies a hit

        Parameters:
        name (str): A human readable name.
        global_unique_id (Optional[str]): A globally unique identifier for the HIT. Serves to create persistency
                                          in the database across multiple launches of "covfee make" and therefore,
                                          be able to add more hits/journeys into an existing database.
                                          It is expected to be unique even across different projects and it is
                                          responsibility of the study administrator to define a naming pattern.
        repeat (int): The number of times the HIT should be repeated. Defaults to 1.
        config (Any): The configuration for the HIT. Defaults to None.
        """
        super().__init__()
        self.name = name
        self.journeys = []
        self.repeat = repeat
        self.global_unique_id = global_unique_id

        self.config = config

    def add_journey(self, nodes=None, journey_global_unique_id: Optional[str] = None):
        j = Journey(nodes, global_unique_id=journey_global_unique_id)
        self.journeys.append(j)
        return j

    def orm(self):
        hit = OrmHit(self.name, [j.orm() for j in self.journeys])
        hit.id_within_study = self.global_unique_id
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
