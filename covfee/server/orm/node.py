from __future__ import annotations

import enum
from datetime import datetime, timedelta
from typing import TYPE_CHECKING, Any, Dict, List, Optional

from flask import current_app as app
from sqlalchemy import ForeignKey, event
from sqlalchemy.ext.associationproxy import AssociationProxy, association_proxy
from sqlalchemy.orm import Mapped, mapped_column, relationship

from covfee.server.scheduler.timers import TimerName, schedule_timer, stop_timer

from .base import Base
from .chat import Chat
from .condition_parser import eval_string

if TYPE_CHECKING:
    from .hit import HITInstance, HITSpec
    from .journey import JourneyInstance, JourneySpec


class JourneySpecNodeSpec(Base):
    __tablename__ = "journeyspec_nodespec"
    journeyspec_id: Mapped[int] = mapped_column(
        ForeignKey("journeyspecs.id"), primary_key=True
    )
    nodespec_id: Mapped[int] = mapped_column(
        ForeignKey("nodespecs.id"), primary_key=True
    )

    journeyspec: Mapped[JourneySpec] = relationship(
        back_populates="nodespec_associations"
    )
    nodespec: Mapped[NodeSpec] = relationship(back_populates="journeyspec_associations")

    order: Mapped[int]  # order of the node within the journey
    player: Mapped[int]  # order of the node within the journey


class JourneyNode(Base):
    __tablename__ = "journey_node"
    journey_id: Mapped[int] = mapped_column(
        ForeignKey("journeyinstances.id"), primary_key=True
    )
    node_id: Mapped[int] = mapped_column(
        ForeignKey("nodeinstances.id"), primary_key=True
    )

    journey: Mapped[JourneyInstance] = relationship(back_populates="node_associations")
    node: Mapped[NodeInstance] = relationship(back_populates="journey_associations")

    order: Mapped[int]
    player: Mapped[int]
    ready: Mapped[bool] = mapped_column(default=False)


class NodeSpec(Base):
    __tablename__ = "nodespecs"

    id: Mapped[int] = mapped_column(primary_key=True)
    type: Mapped[str]

    __mapper_args__ = {
        "polymorphic_identity": "NodeSpec",
        "polymorphic_on": "type",
    }

    settings: Mapped[Dict[str, Any]]  # json

    hitspec_id: Mapped[int] = mapped_column(ForeignKey("hitspecs.id"))
    hitspec: Mapped[HITSpec] = relationship(back_populates="nodespecs")

    # spec relationships
    journeyspec_associations: Mapped[List[JourneySpecNodeSpec]] = relationship(
        back_populates="nodespec"
    )
    journeyspecs: AssociationProxy[List[JourneySpec]] = association_proxy(
        "journeyspec_associations",
        "journeyspec",
        creator=lambda obj: JourneySpecNodeSpec(journeyspec=obj),
    )

    # instance relationships
    nodes: Mapped[List[NodeInstance]] = relationship(back_populates="spec")

    def __init__(self, settings: Dict):
        super().init()
        # default start settings

        self.settings = settings

    def instantiate(self):
        instance = NodeInstance()
        self.nodes.append(instance)
        return instance

    def __call__(self, journey: JourneySpec):
        journey.append(self)
        return journey

    def to_dict(self):
        spec_dict = super().to_dict()
        settings = spec_dict["settings"]
        del spec_dict["settings"]
        spec_dict["customApiBase"] = None
        return {**spec_dict, **settings}


class NodeInstanceStatus(enum.Enum):
    # task has been initialized.
    INIT = 0

    # countdown to start
    COUNTDOWN = 1

    # start conditions full-filled. task has started.
    RUNNING = 2

    # pause condition fullfilled. Waiting for resume conditions.
    PAUSED = 3

    # task/node has ran and is finalized.
    FINISHED = 4


class NodeInstanceManualStatus(enum.Enum):
    # task has been initialized.
    DISABLED = 0

    # task set to manual run
    RUNNING = 1

    # task set to manual pause
    PAUSED = 2


class NodeInstance(Base):
    __tablename__ = "nodeinstances"
    __mapper_args__ = {
        "polymorphic_identity": "NodeInstance",
        "polymorphic_on": "type",
    }

    id: Mapped[int] = mapped_column(primary_key=True)
    type: Mapped[str]

    # spec relationships
    nodespec_id: Mapped[int] = mapped_column(ForeignKey("nodespecs.id"))
    spec: Mapped[NodeSpec] = relationship(back_populates="nodes")

    # instance relationships
    journey_associations: Mapped[List[JourneyNode]] = relationship(
        back_populates="node"
    )
    journeys: AssociationProxy[List[JourneyInstance]] = association_proxy(
        "journey_associations",
        "journey",
        creator=lambda obj: JourneyNode(journey=obj),
    )

    # one HitInstance -> many JourneyInstance
    hit_id: Mapped[bytes] = mapped_column(ForeignKey("hitinstances.id"))
    hit: Mapped[HITInstance] = relationship(back_populates="nodes")

    # status: journeys currently at this node
    curr_journeys: Mapped[List[JourneyInstance]] = relationship(
        back_populates="curr_node"
    )

    # chat relationship
    chat: Mapped[Chat] = relationship(back_populates="node", cascade="all,delete")

    # status code
    manual: Mapped[NodeInstanceManualStatus] = mapped_column(
        default=NodeInstanceManualStatus.DISABLED
    )
    status: Mapped[NodeInstanceStatus] = mapped_column(default=NodeInstanceStatus.INIT)

    # Optional numeric [0-100] progress for the Node
    progress: Mapped[Optional[float]] = mapped_column(default=None)

    dt_start: Mapped[Optional[datetime]]
    dt_pause: Mapped[Optional[datetime]]
    dt_count: Mapped[Optional[datetime]]
    dt_play: Mapped[Optional[datetime]]
    dt_empty: Mapped[Optional[datetime]]
    dt_finish: Mapped[Optional[datetime]]

    t_elapsed: Mapped[Optional[int]]  # keep track of time elapsed (excluding pauses)

    def __init__(self):
        super().init()

    def reset(self):
        """Called until the graph is available
        so that Chat has access to all ORM links
        """
        self.chat = Chat(self)
        self.submitted = False
        self.dt_start = None
        self.dt_pause = None
        self.dt_count = None
        self.dt_play = None
        self.dt_empty = None
        self.dt_finish = None
        self.t_elapsed = 0

        try:
            stop_timer(self, "finish")
            stop_timer(self, "pause")
        except RuntimeError:
            pass

    def reset_annotated_data(self) -> None:
        # To be overriden by the respective TaskInstance
        return

    def eval_expression(self, expression):
        var_values = {
            "N": len(self.curr_journeys),
            "NJOURNEYS": len([j for j in self.journeys if not j.disabled]),
        }
        return eval_string(expression, var_values)

    def eval_condition(self, condition_name: str):
        expression = self.spec.settings[condition_name]
        if expression is None:
            return None
        else:
            return self.eval_expression(expression)

    @property
    def timer_pausable(self):
        return self.spec.settings.get("timer_pausable", False)

    def stop_all_timers(self):
        stop_timer(self, "pause")
        stop_timer(self, "empty")
        stop_timer(self, "finish")
        stop_timer(self, "count")

    def set_manual(self, to_status: NodeInstanceManualStatus):
        from_status = self.manual

        if from_status == to_status:
            return

        if self.status == NodeInstanceStatus.FINISHED:
            return

        if to_status == NodeInstanceManualStatus.DISABLED:
            # here we unfreeze the node and get back to the default flow

            # first check if the task is finished
            if self.check_timer_finish():
                return self.set_status(NodeInstanceStatus.FINISHED, stop_timers=False)

            # the task is not finished
            if self.status in [
                NodeInstanceStatus.COUNTDOWN,
                NodeInstanceStatus.RUNNING,
            ]:
                self.status = NodeInstanceStatus.PAUSED
            self.check_n()

        elif to_status == NodeInstanceManualStatus.PAUSED:
            if from_status == NodeInstanceManualStatus.DISABLED:
                # here we freeze the node state to get back to it when
                # manual control is disabled
                # stop all timers
                self.stop_all_timers()

                # if the task is running, update t_elapsed
                if self.status == NodeInstanceStatus.RUNNING:
                    self.t_elapsed += (datetime.now() - self.dt_play).seconds

                # TODO: call task on_pause
            elif from_status == NodeInstanceManualStatus.RUNNING:
                # RUNNING -> PAUSED
                self.t_elapsed += (datetime.now() - self.dt_play).seconds
            else:
                raise ValueError()
        elif to_status == NodeInstanceManualStatus.RUNNING:
            if from_status == NodeInstanceManualStatus.DISABLED:
                # DISABLED -> RUNNING
                self.stop_all_timers()

                # task may be in INIT state
                if self.dt_start is None:
                    self.dt_start = datetime.now()
                self.dt_play = datetime.now()

                # TODO: call task on_play?
            elif from_status == NodeInstanceManualStatus.PAUSED:
                # PAUSED -> RUNNING
                self.dt_play = datetime.now()
                if self.dt_start is None:
                    self.dt_start = datetime.now()
            else:
                raise ValueError()

        else:
            raise ValueError()

        self.manual = to_status

    def set_status(self, to_status: NodeInstanceStatus, stop_timers=False):
        """' Timer logic"""
        if (
            self.status == NodeInstanceStatus.FINISHED or self.status == to_status
        ):  # status frozen when node paused by the admin
            return

        from_status = self.status

        if to_status == NodeInstanceStatus.COUNTDOWN:
            stop_timer(self, "pause")
            stop_timer(self, "empty")

            timer_countdown = self.spec.settings.get("countdown", 0)
            if timer_countdown == 0:
                # set running status instead.
                return self.set_status(NodeInstanceStatus.RUNNING)
            else:
                self.dt_count = datetime.now()
                schedule_timer(self, "count")

        if to_status == NodeInstanceStatus.RUNNING:
            if self.dt_start is None:
                self.dt_start = datetime.now()
                if not self.timer_pausable:
                    schedule_timer(self, "finish")

            self.dt_play = datetime.now()
            if self.timer_pausable:
                schedule_timer(self, "finish")

        if to_status == NodeInstanceStatus.PAUSED:
            stop_timer(self, "count")
            if self.timer_pausable:
                stop_timer(self, "finish")

            self.dt_pause = datetime.now()
            self.t_elapsed += (self.dt_pause - self.dt_play).seconds
            schedule_timer(self, "pause")

        if to_status == NodeInstanceStatus.FINISHED:
            stop_timer(self, "pause")
            stop_timer(self, "empty")

            self.dt_finish = datetime.now()
            self.t_elapsed += (self.dt_finish - self.dt_play).seconds

            if stop_timers:
                stop_timer(self, "finish")

        self.status = to_status

    def check_timer_finish(self) -> bool:
        """Returns true if the finish timer is complete"""
        timer_finish = self.spec.settings.get("timer", None)
        if timer_finish is None or self.dt_start is None:
            return False

        if self.timer_pausable:
            # count elapsed time
            elapsed_time = self.t_elapsed + (datetime.now() - self.dt_play).seconds
            if elapsed_time > timer_finish:
                return True
        else:
            if datetime.now() > self.dt_start + timedelta(seconds=timer_finish):
                return True
        return False

    def check_timer(self, timer: TimerName):
        """State transitions caused by timers."""
        print(f"check_timer called with timer={timer}")
        if self.status == NodeInstanceStatus.FINISHED:
            app.logger.warn(
                "check_timers called after task finished. Some timers not cancelled?"
            )
        # check timers
        if timer == "finish":
            if self.check_timer_finish():
                self.set_status(NodeInstanceStatus.FINISHED, stop_timers=False)

        elif timer == "count":
            timer_countdown = self.spec.settings.get("countdown", 0)
            if datetime.now() > self.dt_count + timedelta(seconds=timer_countdown):
                self.set_status(NodeInstanceStatus.RUNNING, stop_timers=False)

        elif timer == "pause":
            timer_pause = self.spec.settings.get("timer_pause", None)
            if timer_pause is not None and self.dt_pause is not None:
                if datetime.now() > self.dt_pause + timedelta(seconds=timer_pause):
                    self.set_status(NodeInstanceStatus.FINISHED, stop_timers=False)

        elif timer == "empty":
            timer_empty = self.spec.settings.get("timer_empty", None)
            if timer_empty is not None and self.dt_pause is not None:
                if datetime.now() > self.dt_empty + timedelta(seconds=timer_empty):
                    self.set_status(NodeInstanceStatus.FINISHED, stop_timers=False)

        else:
            raise NotImplementedError()

    def check_n(self):
        """State transitions caused by user connections / disconnections."""
        if (
            self.status == NodeInstanceStatus.FINISHED
        ):  # status frozen when node paused by the admin
            return

        # task lifecycle logic
        if self.status in [NodeInstanceStatus.INIT]:
            n_start = self.spec.settings.get("n_start")

            wait_for_ready = self.spec.settings.get("wait_for_ready", False)
            if wait_for_ready:
                num_ready = len([j for j in self.journey_associations if j.ready])
            else:
                num_ready = len(self.curr_journeys)
            if num_ready >= n_start:
                self.set_status(NodeInstanceStatus.COUNTDOWN, stop_timers=True)

        elif self.status in [NodeInstanceStatus.COUNTDOWN]:
            n_pause = self.spec.settings["n_pause"]
            if n_pause is not None and len(self.curr_journeys) <= n_pause:
                self.set_status(NodeInstanceStatus.PAUSED, stop_timers=True)

        elif self.status in [NodeInstanceStatus.RUNNING]:
            n_pause = self.spec.settings["n_pause"]
            print(n_pause)
            if n_pause is not None and len(self.curr_journeys) <= n_pause:
                self.set_status(NodeInstanceStatus.PAUSED, stop_timers=True)

        elif self.status in [NodeInstanceStatus.PAUSED]:
            n_pause = self.spec.settings["n_pause"]
            if n_pause is not None and len(self.curr_journeys) > n_pause:
                self.set_status(NodeInstanceStatus.COUNTDOWN, stop_timers=True)

        else:
            raise NotImplementedError()

    def make_journey_status_dict(self):
        journeys_in_node = set([j.id for j in self.curr_journeys])
        journey_assocs = []
        for row in self.journey_associations:
            row_dict = row.to_dict()
            row_dict["online"] = row.journey_id in journeys_in_node
            journey_assocs.append(row_dict)
        return journey_assocs

    def get_masked_status(self):
        if self.status != NodeInstanceStatus.FINISHED:
            if self.manual == NodeInstanceManualStatus.RUNNING:
                return NodeInstanceStatus.RUNNING
            elif self.manual == NodeInstanceManualStatus.PAUSED:
                return NodeInstanceStatus.PAUSED
            else:
                return self.status
        else:
            return self.status

    def to_dict(self):
        instance_dict = super().to_dict()
        spec_dict = self.spec.to_dict()

        # merge spec and instance dicts

        instance_dict = {
            **spec_dict,
            **instance_dict,
            "chat_id": self.chat.id,
            "url": f'{app.config["API_URL"]}/nodes/{self.id}',
            "journeys": self.make_journey_status_dict(),
        }

        # mask status using manual status
        instance_dict["status"] = self.get_masked_status()

        return instance_dict

    def make_status_payload(self, prev_status: NodeInstanceStatus = None):
        raise NotImplementedError()

    def make_results_dict(self):
        return {}


@event.listens_for(NodeSpec, "before_insert", propagate=True)
def receive_before_insert(mapper, connection, target: NodeSpec):
    # set the n_start and n_pause variables
    # we do it in a callback to easily get access to the journeys
    if target.settings["n_start"] is None:
        target.settings["n_start"] = len(target.journeyspecs)

    if target.settings["n_pause"] is None:
        target.settings["n_pause"] = max(0, len(target.journeyspecs) - 1)
