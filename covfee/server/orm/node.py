from __future__ import annotations
from datetime import datetime
from typing import Any, Dict, List, TYPE_CHECKING, Optional
import enum
from flask import current_app as app

from sqlalchemy import Table, Column, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column

from .base import Base
from .chat import Chat
from . import utils
from .condition_parser import eval_string, parse_expression, eval_expression

if TYPE_CHECKING:
    from .journey import JourneySpec, JourneyInstance
    from .hit import HITSpec, HITInstance

journeyspec_nodespec_table = Table(
    "journeyspec_nodespec",
    Base.metadata,
    Column("journeyspec", ForeignKey("journeyspecs.id")),
    Column("nodespec", ForeignKey("nodespecs.id")),
)

journey_node_table = Table(
    "journey_node",
    Base.metadata,
    Column("journey", ForeignKey("journeyinstances.id")),
    Column("node", ForeignKey("nodeinstances.id")),
)


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
    journeyspecs: Mapped[List[JourneySpec]] = relationship(
        secondary=journeyspec_nodespec_table, back_populates="nodespecs"
    )

    # instance relationships
    nodes: Mapped[List[NodeInstance]] = relationship(back_populates="spec")

    def __init__(self, settings: Dict):
        super().__init__()
        # default start settings
        for cond in ["start", "stop", "pause"]:
            if cond in settings and settings[cond] is not None:
                try:
                    parse_expression(settings[cond])
                except Exception as ex:
                    raise ValueError(f"Invalid {cond} condition")
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
    journeys: Mapped[List[JourneyInstance]] = relationship(
        secondary=journey_node_table, back_populates="nodes"
    )
    # one HitInstance -> many JourneyInstance
    hit_id: Mapped[bytes] = mapped_column(ForeignKey("hitinstances.id"))
    # hit_id = Column(Integer, ForeignKey('hitinstances.id'))
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

    started_at: Mapped[Optional[datetime]]

    def __init__(self):
        super().__init__()
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

    def update_status(self):
        if self.paused:  # status frozen when node paused by the admin
            return
        # check if the start conditions have been fullfilled
        if self.status in [NodeInstanceStatus.INIT]:
            if self.eval_condition("start"):
                self.status = NodeInstanceStatus.RUNNING
        elif self.status in [NodeInstanceStatus.RUNNING]:
            if self.eval_condition("stop"):
                self.status = NodeInstanceStatus.FINISHED
            else:
                if self.eval_condition("pause"):
                    self.status = NodeInstanceStatus.PAUSED
        elif self.status in [NodeInstanceStatus.PAUSED]:
            if self.eval_condition("stop"):
                self.status = NodeInstanceStatus.FINISHED
            else:
                pause = self.eval_condition("pause")
                if pause == False:
                    self.status = NodeInstanceStatus.RUNNING

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
