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

if TYPE_CHECKING:
    from .journey import JourneySpec, JourneyInstance

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

    # spec relationships
    journeyspecs: Mapped[List[JourneySpec]] = relationship(
        secondary=journeyspec_nodespec_table, back_populates="nodespecs"
    )

    # instance relationships
    nodes: Mapped[List[NodeInstance]] = relationship(back_populates="spec")

    def __init__(self, settings: Dict):
        super().__init__()
        # default start settings
        if len(settings.get("start", [])) == 0:
            settings["start"] = [{"type": "all_journeys"}]
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

    # subject in the node. Waiting for others.
    WAITING = 1

    # start conditions full-filled. task has started.
    RUNNING = 2

    # pause condition fullfilled. Waiting for resume conditions.
    PAUSED = 3

    # task/node has ran and is finalized.
    FINISHED = 4


class NodeInstance(Base):
    __tablename__ = "nodeinstances"

    id: Mapped[int] = mapped_column(primary_key=True)
    type: Mapped[str]
    # id = Column(Integer, primary_key=True)
    __mapper_args__ = {
        "polymorphic_identity": "NodeInstance",
        "polymorphic_on": "type",
    }

    # spec relationships
    nodespec_id: Mapped[int] = mapped_column(ForeignKey("nodespecs.id"))
    spec: Mapped[NodeSpec] = relationship(back_populates="nodes")

    # instance relationships
    journeys: Mapped[List[JourneyInstance]] = relationship(
        secondary=journey_node_table, back_populates="nodes"
    )

    # status: journeys currently at this node
    curr_journeys: Mapped[List[JourneyInstance]] = relationship(
        back_populates="curr_node"
    )

    # chat relationship
    chat: Mapped[Chat] = relationship(back_populates="node")

    # status code
    status: Mapped[NodeInstanceStatus] = mapped_column(default=NodeInstanceStatus.INIT)

    started_at: Mapped[Optional[datetime]]

    def __init__(self):
        super().__init__()
        self.chat = Chat()
        self.submitted = False

    def update_status(self):
        # check if the start conditions have been fullfilled
        if self.status in [NodeInstanceStatus.INIT, NodeInstanceStatus.WAITING]:
            conditions = self.spec.settings.get("start", [])
            if utils.test_conditions(conditions, self):
                self.status = NodeInstanceStatus.RUNNING
            else:
                if len(self.curr_journeys) > 0:
                    self.status = NodeInstanceStatus.WAITING
        elif self.status in [NodeInstanceStatus.RUNNING]:
            conditions = self.spec.settings.get("stop", [])
            if utils.test_conditions(conditions, self):
                self.status = NodeInstanceStatus.FINISHED

    def to_dict(self):
        instance_dict = super().to_dict()
        spec_dict = self.spec.to_dict()

        # merge spec and instance dicts
        instance_dict = {
            **spec_dict,
            **instance_dict,
            "chat_id": self.chat.id,
            "url": f'{app.config["API_URL"]}/tasks/{self.id}',
        }

        return instance_dict
