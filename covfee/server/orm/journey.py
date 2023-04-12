from __future__ import annotations
import datetime
import hmac
import hashlib
from typing import List, TYPE_CHECKING


from ..db import Base
from sqlalchemy import (
    Integer,
    Boolean,
    Column, 
    LargeBinary, 
    DateTime, 
    ForeignKey)
from sqlalchemy.orm import relationship
from flask import current_app as app

from .hit import HITSpec
from .node import journeyspec_nodespec_table, journey_node_table
if TYPE_CHECKING:
    from .node import Node

class JourneySpec(Base):
    __tablename__ = 'journeyspecs'
    id = Column(Integer, primary_key=True)

    # spec relationships
    # up
    hitspec_id = Column(Integer, ForeignKey("hitspecs.id"))
    hitspec = relationship('HITSpec', back_populates='journeyspecs')
    
    # down
    nodespecs = relationship('NodeSpec', 
        secondary=journeyspec_nodespec_table, 
        back_populates='journeyspecs')

    # instance relationships
    journeys = relationship('JourneyInstance', back_populates='journeyspec')
    
    __nodes: List

    # other
    preview_id = Column(LargeBinary, unique=True)

    def __init__(self, nodes: List[Node] = []):
        self.nodes = nodes

    def link(self):
        ''' Links self object and its tree to database instances
        '''
        for journey in self.journeys:
            journey.link()

    def launch(self):
        hit = HITSpec()
        hit.journeys = [self]
        hit.launch()

    def __repr__(self):
        pass

class JourneyInstance(Base):
    ''' Represents an instance of a HIT, to be solved by one user
    '''
    __tablename__ = 'journeyinstances'

    id = Column(LargeBinary, primary_key=True)
    
    # spec relationships
    journeyspec_id = Column(Integer, ForeignKey('journeyspecs.id'))
    journeyspec = relationship("JourneySpec", back_populates='journeys')

    # instance relationships
    hit_id = Column(Integer, ForeignKey('hitinstances.id'))
    hit  = relationship("HITInstance", back_populates='journeys')

    nodes = relationship("NodeInstance",
        secondary=journey_node_table,
        back_populates='journeys')
    
    submitted = Column(Boolean)

    created_at = Column(DateTime, default=datetime.datetime.now)
    updated_at = Column(DateTime, onupdate=datetime.datetime.now)
    submitted_at = Column(DateTime)

    def __init__(self, id, tasks, submitted=False):
        self.id = id
        self.tasks = tasks
        self.preview_id = hashlib.sha256((id + 'preview'.encode())).digest()
        self.submitted = submitted

    def get_api_url(self):
        return f'{app.config["API_URL"]}/instances/{self.id.hex():s}'

    def get_url(self):
        return f'{app.config["APP_URL"]}/hits/{self.id.hex():s}'

    def get_preview_url(self):
        return f'{app.config["APP_URL"]}/hits/{self.preview_id.hex():s}?preview=1'

    def get_completion_info(self):
        completion = {
            'completionCode': self.hit.config.get('completionCode', hashlib.sha256((self.id.hex() + app.config['COVFEE_SECRET_KEY']).encode()).digest().hex()[:12]),
            'redirectName': self.hit.config.get('redirectName', None),
            'redirectUrl': self.hit.config.get('redirectUrl', None)
        }
        return completion

    def get_hmac(self):
        h = hmac.new(app.config['COVFEE_SECRET_KEY'].encode('utf-8'), self.id, hashlib.sha256 )
        return h.hexdigest()

    def submit(self):
        if any([(task.spec.required and not task.has_valid_response()) for task in self.tasks]):
            # cant submit if at least one required task has no valid submissions
            return False, 'Some required tasks have no valid responses.'
        else:
            self.submitted = True
            self.submitted_at = datetime.datetime.now()
            return True, None

    def to_dict(self, with_tasks=False, with_response_info=False):
        instance_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}
        hit_dict = self.hit.to_dict()

        instance_dict['id'] = instance_dict['id'].hex()
        instance_dict['token'] = self.get_hmac()
        instance_dict['hit_id'] = instance_dict['hit_id'].hex()
        instance_dict['preview_id'] = instance_dict['preview_id'].hex()

        # merge hit and instance dicts
        instance_dict = {**hit_dict, **instance_dict}

        if with_tasks:
            prerequisite_tasks = [task for task in self.tasks if task.spec.prerequisite]
            prerequisites_completed = all([task.has_valid_response() for task in prerequisite_tasks])
            instance_dict['prerequisites_completed'] = prerequisites_completed
            if prerequisites_completed:
                instance_dict['tasks'] = [task.to_dict() for task in self.tasks]
            else:
                instance_dict['tasks'] = [task.to_dict() for task in prerequisite_tasks]

        if self.submitted:
            instance_dict['completionInfo'] = self.get_completion_info()

        return instance_dict

    def stream_download(self, z, base_path, csv=False):
        for i, task in enumerate(self.tasks):
            yield from task.stream_download(z, base_path, i, csv)

