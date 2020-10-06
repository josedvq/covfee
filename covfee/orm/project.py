from .orm import db, app
from hashlib import sha256
from copy import copy, deepcopy
import json

from .hit import HIT

class Project(db.Model):
    """ Represents a set of HITs which make up an experiment or annotation project """
    __tablename__ = 'projects'

    id = db.Column(db.Binary, primary_key=True)
    name = db.Column(db.String)
    email = db.Column(db.String)
    hits = db.relationship("HIT", backref="project")

    def __init__(self, id, name, email, hits):
        self.id = id
        self.name = name
        self.email = email
        self.hits = hits

    def as_dict(self, with_hits=False, with_instances=False):
        project_dict = {c.name: getattr(self, c.name)
                        for c in self.__table__.columns}
        project_dict['id'] = project_dict['id'].hex()
        if with_hits:
            project_dict['hits'] = [hit.as_dict(
                with_instances=with_instances) for hit in self.hits]
        return project_dict

    def info(self):
        txt = f'{self.name}\nID: {self.id.hex():s}\n'
        for tl in self.hits:
            txt += tl.showinfo()
        return txt

    def __str__(self):
        txt = f'{self.name} - ID: {self.id.hex():s}\n'
        for tl in self.hits:
            txt += str(tl)
        return txt

    @staticmethod
    def from_dict(proj_dict: dict):
        project = deepcopy(proj_dict)
        proj_json = json.dumps(project)
        hits = list()

        project['hits'] = [HIT.from_dict({
            **p
        }, proj_json+str(i)) for i, p in enumerate(proj_dict['hits'])]
        hash_id = sha256(json.dumps(proj_json).encode()).digest()
        project = Project(id=hash_id, **project)
        return project

    @staticmethod
    def from_json(fpath: str):
        '''
        Loads a project into ORM objects from a project json file.
        '''
        with open(fpath, 'r') as f:
            proj_dict = json.load(f)

        return Project.from_dict(proj_dict)
