import sys
import json
import glob
import os
from hashlib import sha256
sys.path.append('..')

from flask import Flask

from orm import db, Project, Timeline, Task, Chunk
from utils.autoparser import subparser, test_parser
if os.environ['COVFEE_ENV'] == 'production':
    from constants_prod import *
else:
    from constants_dev import *

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE
app.app_context().push()
db.init_app(app)

def create_tables():
    db.create_all()

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
    db.session.add(project)
    db.session.commit()

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
    except Exception as e:
        print('error creating tables, aborting')
        print(e)
        exit(1)

    print(f'loading project files from {PROJECTS_PATH}')
    projects = list()
    for fpath in glob.iglob(f'{PROJECTS_PATH}/*.json'):
        print(f'creating project {fpath}')
        with open(fpath, 'r') as f:
            proj_json = json.load(f)

        timelines = list()
        for i, timeline_json in enumerate(proj_json['timelines']):
            num_timelines = timeline_json.get('repeat', 1)
            if 'repeat' in timeline_json:
                del timeline_json['repeat']

            # insert multiple timelines according to the repeat param
            for j in range(num_timelines):
                timeline = timeline_json.copy()
                tasks = list()
                for task_json in timeline['tasks']:
                    tasks.append(Task(**task_json))
                if 'media' in timeline:
                    for k, v in timeline['media'].items():
                        if k[-3:] == 'url' and v[:4] != 'http':
                            timeline['media'][k] = STATIC_URL + '/' + v
                timeline['tasks'] = tasks
                hash_id = sha256(f'{fpath}_{i:d}_{j:d}'.encode()).digest()
                timelines.append(Timeline(id=hash_id, **timeline))

        proj_json['timelines'] = timelines
        hash_id = sha256(fpath.encode()).digest()
        project = Project(id=hash_id, **proj_json)
        db.session.add(project)
        projects.append(project)
    
    print('commiting to DB')
    db.session.commit()
    print('done!')

    for proj in projects:
        print(proj.showinfo())

if __name__ == '__main__':
    test_parser(globals())
