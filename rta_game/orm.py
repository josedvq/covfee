from sqlalchemy import Column, String, Integer, Boolean, Date, Table, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

# https://auth0.com/blog/sqlalchemy-orm-tutorial-for-python-developers/
# https://leportella.com/sqlalchemy-tutorial.html

project_timeline_association = Table(
    'project_timeline', Base.metadata,
    Column('project_id', Integer, ForeignKey('projects.id')),
    Column('timeline_id', Integer, ForeignKey('timelines.id'))
)

timeline_task_association = Table(
    'timelines_tasks', Base.metadata,
    Column('timeline_id', Integer, ForeignKey('timelines.id')),
    Column('task_id', Integer, ForeignKey('tasks.id'))
)

tasks_chunks_association = Table(
    'tasks_chunks', Base.metadata,
    Column('task_id', Integer, ForeignKey('tasks.id')),
    Column('chunk_id', Integer, ForeignKey('chunks.id'))
)

class Project(Base):
    __tablename__ = 'projects'

    id = Column(Integer, primary_key=True)
    name = Column(String)
    timelines = relationship("Timeline", secondary=project_timeline_association)

    def __init__(self, name, timelines):
        self.name = name
        self.timelines = timelines

    def as_dict(self):
       return {c.name: getattr(self, c.name) for c in self.__table__.columns}

class Timeline(Base):
    __tablename__ = 'timelines'

    id = Column(Integer, primary_key=True)
    url_prefix = Column(String)
    tasks = relationship("Task", secondary=timeline_task_association)

    def __init__(self, url_prefix, tasks):
        self.tasks = tasks
        self.url_prefix = url_prefix

    def as_dict(self, with_tasks=False):
        timeline_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}
        if with_tasks:
            timeline_dict['tasks'] = [task.as_dict() for task in self.tasks]
        return timeline_dict

class Task(Base):
    __tablename__ = 'tasks'

    id = Column(Integer, primary_key=True)
    type = Column(String)
    url = Column(String)
    submitted = Column(Boolean)
    response = Column(JSON)

    chunks = relationship("Chunk", secondary=tasks_chunks_association)

    def __init__(self, type, url, submitted=False):
        self.type = type
        self.url = url
        self.submitted = submitted

    def as_dict(self):
       return {c.name: getattr(self, c.name) for c in self.__table__.columns}

# represents a chunk of a task
class Chunk(Base):
    __tablename__ = 'chunks'

    id = Column(Integer, primary_key=True)
    data = Column(JSON)

    def __init__(self, data):
        self.data = data

