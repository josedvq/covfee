from __future__ import annotations
from typing import List

from sqlalchemy import (
    Table,
    Column,
    ForeignKey)
from sqlalchemy.orm import relationship, Mapped, mapped_column

# from ..db import Base
from .base import Base

journeyspec_nodespec_table = Table(
    'journeyspec_nodespec',
    Base.metadata,
    Column('journeyspec', ForeignKey('journeyspecs.id')),
    Column('nodespec', ForeignKey('nodespecs.id')),
)

journey_node_table = Table(
    'journey_node',
    Base.metadata,
    Column('journey', ForeignKey('journeyinstances.id')),
    Column('node', ForeignKey('nodeinstances.id')),
)

class NodeSpec(Base):
    __tablename__ = 'nodespecs'

    id: Mapped[int] = mapped_column(primary_key=True)
    type: Mapped[str]

    __mapper_args__ = {
        "polymorphic_identity": "NodeSpec",
        "polymorphic_on": "type",
    }

    # spec relationships
    journeyspecs: Mapped[List['JourneySpec']] = relationship(
        secondary=journeyspec_nodespec_table,
        back_populates='nodespecs')

    # instance relationships
    nodes: Mapped[List['NodeInstance']] = relationship(back_populates='spec')

    def __init__(self):
        super().__init__()

    def instantiate(self):
        instance = NodeInstance()
        self.nodes.append(instance)
        return instance

    def __call__(self, journey: 'JourneySpec'):
        journey.append(self)
        return journey


class NodeInstance(Base):
    __tablename__ = 'nodeinstances'

    id: Mapped[int] = mapped_column(primary_key=True)
    type: Mapped[str]
    # id = Column(Integer, primary_key=True)
    __mapper_args__ = {
        "polymorphic_identity": "NodeInstance",
        "polymorphic_on": "type",
    }

    # spec relationships
    nodespec_id: Mapped[int] = mapped_column(ForeignKey('nodespecs.id'))
    spec: Mapped['NodeSpec'] = relationship(back_populates='nodes')

    # instance relationships
    journeys: Mapped[List['JourneyInstance']] = relationship(secondary=journey_node_table, back_populates='nodes')

    submitted: Mapped[bool]

    def __init__(self):
        super().__init__()


    def to_dict(self):
        instance_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}
        spec_dict = self.spec.to_dict()

        # merge spec and instance dicts
        instance_dict = {**spec_dict, **instance_dict}

        return instance_dict