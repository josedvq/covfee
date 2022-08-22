from __future__ import annotations

from sqlalchemy import (
    Table,
    Integer,
    Column,
    ForeignKey)
from sqlalchemy.orm import relationship

from ..db import Base

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

    id = Column(Integer, primary_key=True)

    # spec relationships
    journeyspecs = relationship('JourneySpec', 
        secondary=journeyspec_nodespec_table,
        back_populates='nodespecs')

    # instance relationships
    nodes = relationship('NodeInstance', back_populates='spec')

    def __init__(self):
        pass

class NodeInstance(Base):
    __tablename__ = 'nodeinstances'

    id = Column(Integer, primary_key=True)

    # spec relationships
    nodespec_id = Column(Integer, ForeignKey('nodespecs.id'))
    spec = relationship('NodeSpec', back_populates='nodes')

    # instance relationships
    journeys = relationship('JourneyInstance', 
        secondary=journey_node_table,
        back_populates='nodes')

    def __init__(self):
        pass
