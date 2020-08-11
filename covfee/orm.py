from hashlib import sha256

from sqlalchemy import Column, String, Integer, Binary, Boolean, Date, Table, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

# https://auth0.com/blog/sqlalchemy-orm-tutorial-for-python-developers/
# https://leportella.com/sqlalchemy-tutorial.html

class Project(Base):
    __tablename__ = 'projects'

    id = Column(Binary, primary_key=True)
    name = Column(String)
    email = Column(String)
    timelines = relationship("Timeline", backref="project")

    def __init__(self, id, name, email, timelines):
        self.id = id
        self.name = name
        self.email = email
        self.timelines = timelines

    def as_dict(self):
       project_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}
       project_dict['id'] = project_dict['id'].hex()
       return project_dict

    def __str__(self):
        txt = f'{self.name}\nID: {self.id.hex():s}\n'
        for tl in self.timelines:
            txt += str(tl)
        return txt

class Timeline(Base):
    __tablename__ = 'timelines'

    id = Column(Binary, primary_key=True)
    project_id = Column(Integer, ForeignKey('projects.id'))
    url_prefix = Column(String)
    tasks = relationship("Task", backref='timeline')
    submitted = Column(Boolean)

    def __init__(self, id, url_prefix, tasks, submitted=False):
        self.id = id
        self.url_prefix = url_prefix
        self.tasks = tasks
        self.submitted = submitted

    def as_dict(self, with_tasks=False):
        timeline_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}
        if with_tasks:
            timeline_dict['tasks'] = [task.as_dict() for task in self.tasks]
        timeline_dict['id'] = timeline_dict['id'].hex()
        timeline_dict['project'] = self.project.as_dict()
        del timeline_dict['project_id']

        if self.submitted:
            timeline_dict['completion_code'] = sha256(
                (self.id.hex() + '2208').encode()).digest().hex()[:12]

        return timeline_dict

    def __str__(self):
        return f' - id: {self.id.hex():s}\n'

class Task(Base):
    __tablename__ = 'tasks'

    id = Column(Integer, primary_key=True)
    timeline_id = Column(Integer, ForeignKey('timelines.id'))
    type = Column(String)
    media = Column(JSON)
    submitted = Column(Boolean)
    form = Column(JSON)
    response = Column(JSON)

    chunks = relationship("Chunk", backref='task')

    def __init__(self, type, media, form=None, submitted=False):
        self.type = type
        self.media = media
        self.form = form
        self.submitted = submitted

    def as_dict(self):
       task_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}
       task_dict['timeline_id'] = task_dict['timeline_id'].hex()
       return task_dict

# represents a chunk of a task
class Chunk(Base):
    __tablename__ = 'chunks'

    id = Column(Integer, primary_key=True)
    task_id = Column(Integer, ForeignKey('tasks.id'))
    data = Column(JSON)

    def __init__(self, data):
        self.data = data