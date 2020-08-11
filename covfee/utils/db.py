import sys
import json
import glob
import os
from hashlib import sha256
sys.path.append('..')

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from orm import Base, Project, Timeline, Task, Chunk
from my_parsing.autoparsing import subparser, test_parser
from constants import *

engine = create_engine(f'sqlite:///{DATABASE_PATH}')
Session = sessionmaker(bind=engine)
session = Session()

def create_tables():
    Base.metadata.create_all(engine)

def insert_project(fpath):
    with open(fpath, 'r') as f:
        proj_json = json.load(f)
    
    timelines = list()
    for i, timeline_json in enumerate(proj_json['timelines']):
        tasks = list()
        for task_json in timeline_json['tasks']:
            tasks.append(Task(**task_json))
        timeline_json['tasks'] = tasks
        hash_id = sha256(f'{fpath}_{i:d}'.encode()).digest()
        timelines.append(Timeline(id=hash_id, **timeline_json))

    proj_json['timelines'] = timelines
    hash_id = sha256(fpath.encode()).digest()
    project = Project(id=hash_id, **proj_json)
    session.add(project)
    session.commit()

@subparser
def reload_projects():
    try:
        os.remove(DATABASE_PATH)
        print(f'deleted existing database file {DATABASE_PATH}')
    except OSError:
        pass

    try:
        print('creating tables')
        create_tables()
        print('tables created')
    except Exception:
        print('error creating tables, aborting')
        exit(1)

    print(f'loading project files from {PROJECTS_PATH}')
    projects = list()
    for fpath in glob.iglob(f'{PROJECTS_PATH}/*.json'):
        print(f'creating project {fpath}')
        with open(fpath, 'r') as f:
            proj_json = json.load(f)

        timelines = list()
        for i, timeline_json in enumerate(proj_json['timelines']):
            tasks = list()
            for task_json in timeline_json['tasks']:
                tasks.append(Task(**task_json))
            timeline_json['tasks'] = tasks
            hash_id = sha256(f'{fpath}_{i:d}'.encode()).digest()
            timelines.append(Timeline(id=hash_id, **timeline_json))

        proj_json['timelines'] = timelines
        hash_id = sha256(fpath.encode()).digest()
        project = Project(id=hash_id, **proj_json)
        session.add(project)
        projects.append(project)
    
    print('comminting to DB')
    session.commit()
    print('done!')

    for proj in projects:
        print(proj)

if __name__ == '__main__':
    test_parser(globals())
