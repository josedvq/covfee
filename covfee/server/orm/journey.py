import datetime
import hmac
import hashlib
from typing import List
from node import Node
from hit import HITSpec

from db import Base
from sqlalchemy import (
    Integer,
    Boolean,
    Column, 
    LargeBinary, 
    DateTime, 
    ForeignKey)
from sqlalchemy.orm import relationship
from flask import current_app as app

from .db import db
from hashlib import sha256

class JourneySpec:
    __tablename__ = 'journeyspecs'
    id = Column(Integer, primary_key=True)
    task_specs = relationship('TaskSpec')
    hitspec_id = Column(Integer, ForeignKey("hitspecs.id"))

    __nodes: List

    def __init__(self, nodes: List):
        self.nodes = nodes

    @property
    def nodes(self):
        return self.__nodes

    @nodes.setter
    def nodes(self, val):
        self.__nodes = val

    def append(self, node: Node):
        self.__nodes.append(node)

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
    __tablename__ = 'journeys'

    id = Column(LargeBinary, primary_key=True)

    # id used for visualization
    preview_id = Column(LargeBinary, unique=True)
    hit_id = Column(LargeBinary, ForeignKey('hits.id'))
    # backref hit

    tasks = relationship("Task", backref='hitinstance', cascade="all, delete")
    submitted = Column(Boolean)

    created_at = Column(DateTime, default=datetime.datetime.now)
    updated_at = Column(DateTime, onupdate=datetime.datetime.now)
    submitted_at = Column(DateTime)

    def __init__(self, id, tasks, submitted=False):
        self.id = id
        self.tasks = tasks
        self.preview_id = sha256((id + 'preview'.encode())).digest()
        self.submitted = submitted

    def get_api_url(self):
        return f'{app.config["API_URL"]}/instances/{self.id.hex():s}'

    def get_url(self):
        return f'{app.config["APP_URL"]}/hits/{self.id.hex():s}'

    def get_preview_url(self):
        return f'{app.config["APP_URL"]}/hits/{self.preview_id.hex():s}?preview=1'

    def get_completion_info(self):
        completion = {
            'completionCode': self.hit.config.get('completionCode', sha256((self.id.hex() + app.config['COVFEE_SECRET_KEY']).encode()).digest().hex()[:12]),
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

    def as_dict(self, with_tasks=False, with_response_info=False):
        instance_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}
        hit_dict = self.hit.as_dict()

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
                instance_dict['tasks'] = [task.as_dict() for task in self.tasks]
            else:
                instance_dict['tasks'] = [task.as_dict() for task in prerequisite_tasks]

        if self.submitted:
            instance_dict['completionInfo'] = self.get_completion_info()

        return instance_dict

    def stream_download(self, z, base_path, csv=False):
        for i, task in enumerate(self.tasks):
            yield from task.stream_download(z, base_path, i, csv)

