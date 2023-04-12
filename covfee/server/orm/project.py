from __future__ import annotations
import os
import json
from typing import List, TYPE_CHECKING

import pandas as pd
from sqlalchemy import (
    String,
    Column, 
    Integer)
from sqlalchemy.orm import relationship

from ..db import Base
import covfee.launcher as launcher

if TYPE_CHECKING:
    from .hit import HITSpec

class Project(Base):
    __tablename__ = 'projects'
    name = Column(String, primary_key=True)
    hitspecs = relationship('HITSpec', back_populates='project')

    def __init__(self, name = 'Sample', email = 'example@example.com', hitspecs: List[HITSpec] = []):
        self.name = name
        self.email = email
        self.hitspecs = hitspecs

        # to keep track of info at launch time
        self._conflicts = False
        self._filename = None

    def link(self):
        ''' Links self object and its tree to database instances
        '''
        for hit in self.hitspecs:
            hit.link()

    def launch(self):
        l = launcher.Launcher([self])
        l.start(mode='dev')

    def __repr__(self):
        pass

    def get_dataframe(self):
        list_of_instances = list()
        for hit in self.hitspecs:
            for instance in hit.instances:
                list_of_instances.append({
                    'hit_name': hit.name,
                    'id': instance.id.hex(),
                    'url': instance.get_url(),
                    'preview_url': instance.get_preview_url(),
                    'completion_code': instance.get_completion_code()
                })
        df = pd.DataFrame(list_of_instances, columns=['hit_name', 'id', 'url', 'preview_url', 'completion_code'])
        
        return df
    
    @staticmethod
    def from_name(name: str):
        # TODO: attach session to Project
        return Project.session.query(Project).where(Project.name == name).first()

    @staticmethod
    def from_json(fpath: str):
        '''
        Loads a project into ORM objects from a project json file.
        '''
        with open(fpath, 'r') as f:
            proj_dict = json.load(f)

        return Project(**proj_dict)

    def stream_download(self, z, base_path, submitted_only=True, csv=False):
        for hit in self.hitspecs:
            for instance in hit.instances:
                if submitted_only and not instance.submitted:
                    continue
                yield from instance.stream_download(z, 
                    os.path.join(base_path, instance.id.hex()), 
                    csv=csv)
                
    def to_dict(self, with_hits=False, with_instances=False, with_config=False):
        project_dict = {c.name: getattr(self, c.name)
                        for c in self.__table__.columns}
        if with_hits:
            project_dict['hits'] = [hit.to_dict(with_instances=with_instances, with_config=with_config) for hit in self.hitspecs]
        return project_dict