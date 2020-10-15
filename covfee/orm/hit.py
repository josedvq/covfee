import shutil
import os

from .orm import db, app
from .task import Task
from hashlib import sha256
from .task import TaskResponse

hits_tasks = db.Table('hits_tasks',
    db.Column('hit_id', db.Integer, db.ForeignKey('hits.id'), primary_key=True),
    db.Column('task_id', db.Integer, db.ForeignKey('tasks.id'), primary_key=True))

hitistances_tasks = db.Table('hitistances_tasks',
    db.Column('hitinstance_id', db.Integer, db.ForeignKey('hitinstances.id'), primary_key=True),
    db.Column('task_id', db.Integer, db.ForeignKey('tasks.id'), primary_key=True))

class HIT(db.Model):
    """ Represents a set of tasks to be completed by one subject, ie. a HIT """
    __tablename__ = 'hits'
    __table_args__ = (
        db.UniqueConstraint('project_id', 'name'),
    )

    id = db.Column(db.Binary, primary_key=True)
    type = db.Column(db.String)
    name = db.Column(db.String)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'))
    media = db.Column(db.JSON)
    instances = db.relationship("HITInstance", backref='hit')
    tasks = db.relationship("Task", secondary=hits_tasks, backref='hit')
    submitted = db.Column(db.Boolean)
    test = db.Column(db.String)

    def __init__(self, id, type, name, media=None, tasks=[], instances=[], submitted=False):
        self.id = id
        self.type = type
        self.name = name
        self.tasks = tasks
        self.instances = instances
        self.submitted = submitted
        self.test = 'this is a test'

        # fix URLs
        if media is not None:
            for k, v in media.items():
                if k[-3:] == 'url' and v[:4] != 'http':
                    media[k] = app.config['MEDIA_URL'] + '/' + v

        self.media = media

    @staticmethod
    def from_dict(hit_dict, seedstr):
        num_instances = hit_dict.get('repeat', 1)
        hashstr = seedstr + hit_dict['name']

        tasks = [Task.from_dict(
            task
        ) for task in hit_dict['tasks']]

        # insert multiple hits/URLs according to the repeat param
        # for annotation hits, tasks belong to instances
        # for timeline hits, tasks belong to HITs
        # instances are always created
        is_annotation = (hit_dict['type'] == 'annotation')
        instances = [HITInstance.from_dict({
            'id': sha256(f'{hashstr}_{j:d}'.encode()).digest(),
            'submitted': False,
            'tasks': hit_dict['tasks'] if is_annotation else []
        }) for j in range(num_instances)]

        return HIT(
            id=sha256(hashstr.encode()).digest(),
            type=hit_dict['type'],
            name=hit_dict['name'],
            media=hit_dict['media'],
            tasks=tasks if not is_annotation else [],
            instances=instances,
            submitted=False)

    def as_dict(self, with_project=True, with_tasks=False, with_instances=False, with_instance_tasks=False):
        hit_dict = {c.name: getattr(self, c.name)
                    for c in self.__table__.columns}
        hit_dict['id'] = hit_dict['id'].hex()

        if with_tasks:
            hit_dict['tasks'] = {task.id: task.as_dict()
                                 for task in self.tasks}

        if with_instances:
            hit_dict['instances'] = [instance.as_dict(
                with_tasks=with_instance_tasks) for instance in self.instances]

        if with_project:
            hit_dict['project'] = self.project.as_dict()
        del hit_dict['project_id']

        if self.submitted:
            hit_dict['completion_code'] = sha256(
                (self.id.hex() + app.config['COVFEE_SALT']).encode()).digest().hex()[:12]

        return hit_dict

    def showinfo(self):
        s = [instance.get_url() + '\n - ' + instance.get_api_url() + '\n'
             for instance in self.instances]
        return '\n'.join(s)

    def __str__(self):
        txt = f'{self.get_url()}'
        return txt


class HITInstance(db.Model):
    """ Represents an instance of a HIT, to be performed by one user """
    __tablename__ = 'hitinstances'

    id = db.Column(db.Binary, primary_key=True)
    hit_id = db.Column(db.Integer, db.ForeignKey('hits.id'))
    tasks = db.relationship("Task", secondary=hitistances_tasks, backref='hitinstance')
    responses = db.relationship("TaskResponse", backref='hitinstance', lazy='dynamic')
    submitted = db.Column(db.Boolean)

    def __init__(self, id, tasks, submitted=False):
        self.id = id
        self.tasks = tasks
        self.submitted = submitted

    def get_api_url(self):
        return f'{app.config["API_URL"]}/instances/{self.id.hex():s}'

    def get_url(self):
        return f'{app.config["APP_URL"]}/hits/{self.id.hex():s}'

    @staticmethod
    def from_dict(instance_dict):
        if 'tasks' in instance_dict:
            # insert multiple tasks
            tasks = [Task.from_dict(
                task
            ) for task in instance_dict['tasks']]
            del instance_dict['tasks']

        return HITInstance(
            **instance_dict,
            tasks=tasks
        )

    def as_dict(self, with_tasks=False, with_responses=False):
        instance_dict = {c.name: getattr(self, c.name)
                         for c in self.__table__.columns}
        hit_dict = self.hit.as_dict(with_tasks=with_tasks)
        instance_dict['id'] = instance_dict['id'].hex()
        instance_dict['hit_id'] = instance_dict['hit_id'].hex()

        # merge hit and instance dicts
        instance_dict = {**hit_dict, **instance_dict}

        if with_tasks:
            # join instance and HIT tasks

            instance_tasks = {task.id: task.as_dict() for task in self.tasks}
            instance_dict['tasks'] = {**instance_tasks, **hit_dict['tasks']}

            if with_responses:
                for task_id, task in instance_dict['tasks'].items():
                    # query the latest response
                    # only include submitted responses
                    lastResponse = self.responses.filter_by(
                        task_id=task_id, submitted=True).order_by(TaskResponse.index.desc()).first()
                    if lastResponse is None:
                        instance_dict['tasks'][task_id]['response'] = None
                    else:
                        instance_dict['tasks'][task_id]['response'] = lastResponse.as_dict()

        if self.submitted:
            instance_dict['completion_code'] = sha256(
                (self.id.hex() + app.config['COVFEE_SALT']).encode()).digest().hex()[:12]

        return instance_dict

    def make_json_download(self):
        # create a folder to store all the files
        dirpath = os.path.join(app.config['TMP_PATH'], self.id.hex())
        if os.path.exists(dirpath) and os.path.isdir(dirpath):
            shutil.rmtree(dirpath)

        os.mkdir(dirpath)

        # go over all submitted responses to this HIT instance
        responses = self.responses.filter_by(submitted=True).all()

        if len(responses) == 0:
            return None

        for response in responses:
            response.write_json(dirpath)

        shutil.make_archive(os.path.join(app.config['TMP_PATH'], 'download'), 'zip', dirpath)
        shutil.rmtree(dirpath)
        return 'download.zip'

