from __future__ import annotations
import hmac
import hashlib
import datetime
from typing import List, TYPE_CHECKING
from hashlib import sha256

from flask import current_app as app
from sqlalchemy import (
    Integer,
    Column, 
    LargeBinary, 
    DateTime, 
    ForeignKey)
from sqlalchemy.orm import relationship

from ..db import Base
from .project import Project
if TYPE_CHECKING:
    from .journey import JourneySpec

class HITSpec(Base):
    __tablename__ = 'hitspecs'
    id = Column(Integer, primary_key=True)

    # spec relationship
    journeyspecs = relationship('JourneySpec', back_populates='hitspec')

    project_id = Column(Integer, ForeignKey("projects.id"))
    project = relationship('Project', back_populates='hitspecs')
    
    # instance relationship
    instances = relationship('HITInstance', back_populates='spec')    

    def __init__(self, name = 'Sample', journeys: List[JourneySpec] = []):
        self.name = name
        self.journeys = journeys

    @property
    def name(self):
        return self.__name

    @name.setter
    def name(self, val):
        self.__name = val

    @property
    def journeys(self):
        return self.__journeys

    @journeys.setter
    def journeys(self, val):
        self.__journeys = val

    def link(self):
        ''' Links self object and its tree to database instances
        '''
        for journey in self.journeys:
            journey.link()
   
    def launch(self):
        project = Project()
        project.hits = [self]
        project.launch()

    def __repr__(self):
        pass

    def get_api_url(self):
        return f'{app.config["API_URL"]}/hits/{self.id.hex()}'

    def get_generator_url(self):
        ''' URL to the generator endpoint, which will instantiate the HIT and redirect the user to the new instance
        For use in linking from crowdsourcing websites (eg. Prolific)
        '''
        return f'{app.config["API_URL"]}/hits/{self.id.hex():s}/instances/add_and_redirect'

class HITInstance(Base):
    ''' Represents an instance of a HIT, to be solved by one user
        - one HIT instance maps to one URL that can be sent to a participant to access and solve the HIT.
        - a HIT instance is specified by the abstract HIT it is an instance of.
        - a HIT instance is linked to a list of tasks (instantiated task specifications),
        which hold the responses for the HIT
    '''
    __tablename__ = 'hitinstances'

    id = Column(LargeBinary, primary_key=True)

    # spec relationship
    hitspec_id = Column(Integer, ForeignKey('hitspecs.id'))
    spec = relationship('HITSpec', back_populates='instances')

    # instance relationships
    journeys = relationship('JourneyInstance', back_populates='hit', cascade="all, delete")
    
    # other
    preview_id = Column(LargeBinary, unique=True)
    created_at = Column(DateTime, default=datetime.datetime.now)
    updated_at = Column(DateTime, onupdate=datetime.datetime.now)
    submitted_at = Column(DateTime)

    def __init__(self, id, taskspecs=[], submitted=False):
        self.id = id
        self.preview_id = sha256((id + 'preview'.encode())).digest()
        self.submitted = submitted

        for spec in taskspecs:
            self.tasks.append(spec.instantiate())

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

