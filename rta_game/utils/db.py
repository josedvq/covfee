import sys
import json
sys.path.append('..')

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from orm import Base, Project, Timeline, Task, Chunk

engine = create_engine('sqlite:///../database.db', echo=True)
Session = sessionmaker(bind=engine)
session = Session()

def create_tables():
    Base.metadata.create_all(engine)

def insert_project(fpath):
    with open(fpath, 'r') as f:
        proj_json = json.load(f)
    
    timelines = list()
    for timeline_json in proj_json['timelines']:
        tasks = list()
        for task_json in timeline_json['tasks']:
            tasks.append(Task(**task_json))
        timeline_json['tasks'] = tasks
        timelines.append(Timeline(**timeline_json))

    proj_json['timelines'] = timelines
    project = Project(**proj_json)
    session.add(project)
    session.commit()

