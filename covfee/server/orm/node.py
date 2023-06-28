from __future__ import annotations
from typing import List, TYPE_CHECKING
import enum

from sqlalchemy import Table, Column, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column

from .base import Base
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

    # spec relationships
    journeyspecs: Mapped[List["JourneySpec"]] = relationship(
        secondary=journeyspec_nodespec_table, back_populates="nodespecs"
    )

    # instance relationships
    nodes: Mapped[List["NodeInstance"]] = relationship(back_populates="spec")

    def __init__(self):
        super().__init__()

    def instantiate(self):
        instance = NodeInstance()
        self.nodes.append(instance)
        return instance

    def __call__(self, journey: "JourneySpec"):
        journey.append(self)
        return journey


class TaskInstanceStatus(enum.Enum):
    INIT = 0
    WAITING = 1
    RUNNING = 2
    PAUSED = 3
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
    spec: Mapped["NodeSpec"] = relationship(back_populates="nodes")

    # instance relationships
    journeys: Mapped[List["JourneyInstance"]] = relationship(
        secondary=journey_node_table, back_populates="nodes"
    )

    # status: journeys currently at this node
    curr_journeys: Mapped[List["JourneyInstance"]] = relationship(
        back_populates="curr_node"
    )
    # status code
    status: Mapped[TaskInstanceStatus] = mapped_column(default=TaskInstanceStatus.INIT)

    def __init__(self):
        super().__init__()
        self.submitted = False

    def update_status(self):
        pass

    def to_dict(self):
        instance_dict = super().to_dict()
        spec_dict = self.spec.to_dict()

        # merge spec and instance dicts
        instance_dict = {**spec_dict, **instance_dict}

        return instance_dict
