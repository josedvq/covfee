from __future__ import annotations
from datetime import datetime, timedelta
from typing import Any, Dict, List, TYPE_CHECKING, Optional
import enum
from flask import current_app as app

from sqlalchemy import Table, Column, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.ext.associationproxy import association_proxy, AssociationProxy

from .base import Base
from .chat import Chat
from . import utils
from .condition_parser import eval_string, parse_expression, eval_expression

if TYPE_CHECKING:
    from .journey import JourneySpec, JourneyInstance
    from .hit import HITSpec, HITInstance


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
        return {**spec_dict, **settings}


class NodeInstanceStatus(enum.Enum):
    # task has been initialized.
    INIT = 0

    # start conditions full-filled. task has started.
    RUNNING = 1

    # pause condition fullfilled. Waiting for resume conditions.
    PAUSED = 2

    # task/node has ran and is finalized.
    FINISHED = 3


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
    status: Mapped[NodeInstanceStatus] = mapped_column(default=NodeInstanceStatus.INIT)
    paused: Mapped[bool] = mapped_column(default=False)

    dt_start: Mapped[Optional[datetime]]
    dt_pause: Mapped[Optional[datetime]]
    dt_empty: Mapped[Optional[datetime]]
    dt_finish: Mapped[Optional[datetime]]

    def __init__(self):
        super().init()
        self.chat = Chat()
        self.submitted = False

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

    def set_status(self, status: NodeInstanceStatus):
        if (
            self.paused
            or self.status == NodeInstanceStatus.FINISHED
            or self.status == status
        ):  # status frozen when node paused by the admin
            return

        if (
            self.status == NodeInstanceStatus.INIT
            and status == NodeInstanceStatus.RUNNING
        ):
            self.dt_start = datetime.now

        if status == NodeInstanceStatus.PAUSED:
            self.dt_pause = datetime.now

        if status == NodeInstanceStatus.FINISHED:
            self.dt_finish = datetime.now

        self.status = status

    def update_status(self):
        if (
            self.paused or self.status == NodeInstanceStatus.FINISHED
        ):  # status frozen when node paused by the admin
            return

        # check timers
        timer = self.spec.settings.get("timer", None)
        if timer is not None and self.dt_start is not None:
            if datetime.now > self.dt_start + timedelta(seconds=timer):
                self.set_status(NodeInstanceStatus.FINISHED)

        timer_pause = self.spec.settings.get("timer_pause", None)
        if timer_pause is not None and self.dt_pause is not None:
            if datetime.now > self.dt_pause + timedelta(seconds=timer_pause):
                self.set_status(NodeInstanceStatus.FINISHED)

        timer_empty = self.spec.settings.get("timer_empty", None)
        if timer_empty is not None and self.dt_pause is not None:
            if datetime.now > self.dt_empty + timedelta(seconds=timer_empty):
                self.set_status(NodeInstanceStatus.FINISHED)

        # task lifecycle logic
        if self.status in [NodeInstanceStatus.INIT]:
            if len(self.curr_journeys) >= self.spec.settings["n_start"]:
                self.set_status(NodeInstanceStatus.RUNNING)

        elif self.status in [NodeInstanceStatus.RUNNING]:
            if len(self.curr_journeys) <= self.spec.settings["n_pause"]:
                self.set_status(NodeInstanceStatus.PAUSED)

        elif self.status in [NodeInstanceStatus.PAUSED]:
            if len(self.curr_journeys) > self.spec.settings["n_pause"]:
                self.set_status(NodeInstanceStatus.RUNNING)

    def to_dict(self):
        instance_dict = super().to_dict()
        spec_dict = self.spec.to_dict()

        # merge spec and instance dicts
        instance_dict = {
            **spec_dict,
            **instance_dict,
            "chat_id": self.chat.id,
            "url": f'{app.config["API_URL"]}/nodes/{self.id}',
            "num_journeys": len(self.journeys),
            "curr_journeys": [j.id.hex() for j in self.curr_journeys],
        }

        return instance_dict

    def make_status_payload(self, prev_status: NodeInstanceStatus = None):
        if prev_status is None:
            prev_status = self.status
        return {
            "id": self.id,
            "hit_id": self.hit_id.hex(),
            "prev": prev_status,
            "new": self.status,
            "paused": self.paused,
            "curr_journeys": [j.id.hex() for j in self.curr_journeys],
        }

    def make_results_dict(self):
        return {}

    def pause(self, pause: bool):
        self.paused = pause
