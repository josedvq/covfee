from typing import Any, List, Tuple, Optional

from sqlalchemy.orm import scoped_session
from sqlalchemy import select

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
from covfee.server.orm import HITInstance, JourneyInstance
import os


class PostInitCaller(type):
    def __call__(cls, *args, **kwargs):
        obj = type.__call__(cls, *args, **kwargs)
        obj.__post_init__()
        return obj


class BaseDataclass:
    pass


class CovfeeTask(BaseDataclass, metaclass=PostInitCaller):
    _orm_task: Optional[OrmTask] = None
    _player_count: int

    def __init__(self):
        super().__init__()
        self._player_count = -1

    def create_orm_task_object(self) -> OrmTask:
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
            self.nodes_players = []
        self.name = name
        self.global_unique_id = global_unique_id

    def create_orm_journey_object(self) -> OrmJourney:
        journey = OrmJourney(
            [(n.create_orm_task_object(), p) for n, p in self.nodes_players]
        )
        journey.global_unique_id = self.global_unique_id
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

    def add_journey(
        self, nodes=None, journey_global_unique_id: Optional[str] = None
    ) -> Journey:
        j = Journey(nodes, global_unique_id=journey_global_unique_id)
        self.journeys.append(j)
        return j

    def create_orm_hit_object(self) -> OrmHit:
        hit = OrmHit(self.name, [j.create_orm_journey_object() for j in self.journeys])
        hit.global_unique_id = self.global_unique_id
        logger.debug(f"Created ORM HIT: {str(hit)}")
        return hit


class Project(BaseDataclass):
    name: str
    email: str
    hits: List[HIT]

    def __init__(self, name: str, email: str, hits: HIT = None):
        super().__init__()
        self.name = name
        self.email = email
        self.hits = hits if hits is not None else list()

    def create_or_update_orm_specs_data(self, session: scoped_session) -> OrmProject:
        project: Optional[OrmProject] = session.execute(
            select(OrmProject).filter_by(name=self.name)
        ).scalar_one_or_none()
        if project is not None:
            logger.info(
                f"Project {self.name} already exists! Will only accept HITs/Journeys with new global_unique_ids."
            )
            project.email = self.email

            for new_hit in self.hits:
                if new_hit.global_unique_id is None:
                    logger.info("HIT missing global_unique_id. Skipping...")
                    continue
                hitspec_in_db: Optional[OrmHit] = session.execute(
                    select(OrmHit).filter_by(global_unique_id=new_hit.global_unique_id)
                ).scalar_one_or_none()
                if hitspec_in_db is not None:
                    logger.info(
                        f"HIT {new_hit.global_unique_id} already exists. Checking whether to add new journeys."
                    )
                    for journey in new_hit.journeys:
                        if journey.global_unique_id is None:
                            logger.info(
                                f"Cant' add new journeys to HIT without a global_unique_id. Skipping..."
                            )
                            continue
                        journey_in_db = session.execute(
                            select(OrmJourney).filter_by(
                                global_unique_id=journey.global_unique_id
                            )
                        ).scalar_one_or_none()
                        if journey_in_db is not None:
                            logger.info(
                                f"Journey {journey.global_unique_id} already exists. Skipping..."
                            )
                        else:
                            logger.info(
                                f"Journey {journey.global_unique_id} being created."
                            )
                            journey_orm = journey.create_orm_journey_object()
                            hitspec_in_db.append_journeyspecs([journey_orm])
                else:
                    project.hitspecs.append(new_hit.create_orm_hit_object())
        else:
            logger.info(
                f"Project {self.name} did not exist. Will be created from scratch as is."
            )
            project = OrmProject(
                self.name, self.email, [h.create_orm_hit_object() for h in self.hits]
            )
            logger.debug(f"Created ORM Project: {str(project)}")
        return project

    def create_orm_instances_for_hitspecs_journeyspecs_without_instances(
        self, orm_project: OrmProject, session: scoped_session
    ) -> OrmProject:
        # Note: this implementation will create instances
        if os.environ.get("COVFEE_ENV") == "dev":
            # In dev mode, instances ids are explicitly set through a ClassVar counter.
            # In case the project already exists with prior instances, we need to update
            # that counter relying on what is in the database.
            # already existed, with previous instances, we
            HITInstance.instance_counter = session.query(HITInstance).count() + 1
            JourneyInstance.instance_counter = (
                session.query(JourneyInstance).count() + 1
            )

        for hitspec in orm_project.hitspecs:
            if len(hitspec.instances) == 0:
                hitspec.instantiate()
                for hit_instance in hitspec.instances:
                    for node in hit_instance.nodes:
                        # FIXME - It's unclear why chats are not being added when the
                        #         updated orm_project is added to the session.
                        session.add(node.chat)
            else:
                # We check now whether the hit instances are missing journey instances
                for hit_instance in hitspec.instances:
                    # We collect the journeyspecs without their own instances
                    journeyspecs_without_instances = [
                        journey_spec
                        for journey_spec in hitspec.journeyspecs
                        if len(journey_spec.journeys) == 0
                    ]
                    if len(journeyspecs_without_instances) > 0:
                        hit_instance.instantiate_new_journeys(
                            journeyspecs_without_instances
                        )
                        for node in hit_instance.nodes:
                            # FIXME - It's unclear why chats are not being added when the
                            #         updated orm_project is added to the session.
                            session.add(node.chat)


class CovfeeApp(BaseDataclass):
    _projects_specs: List[Project]

    def __init__(self, projects: List[Project]) -> None:
        super().__init__()
        self._projects_specs = projects

    def add_to_database_new_or_updated_projects_specifications_and_instances(
        self, session: scoped_session
    ) -> List[OrmProject]:
        """
        If a session is provided, it is assumed that the related projects could already exist and we
        could potentially be committing new specs and their related instances.
        """
        for project_specs in self._projects_specs:
            # We first create or update the project specs data, meaning the respective
            # hitspecs and journeyspecs. If the project is new, it will create data for
            # all provided HITs. Otherwise, it will create specs only for new HITs
            # or journeys with global_unique_ids.
            orm_project = project_specs.create_or_update_orm_specs_data(session)

            # We then create instances for hitspecs and journeyspecs without instances.
            # This is equally valid for a newly created project, or the newly created specs
            # for an existing project.
            project_specs.create_orm_instances_for_hitspecs_journeyspecs_without_instances(
                orm_project, session
            )

            session.add(orm_project)
