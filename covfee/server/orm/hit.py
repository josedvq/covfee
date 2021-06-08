import os

from flask import current_app as app

from .db import db
from hashlib import sha256
from covfee.server.orm.task import TaskSpec

hits_taskspecs = db.Table(
    'hits_taskspecs',
    db.Column('hit_id', db.Integer, db.ForeignKey('hits.id'), primary_key=True),
    db.Column('taskspec_id', db.Integer, db.ForeignKey('taskspecs.id'), primary_key=True))


class HIT(db.Model):
    """ Represents a set of tasks to be completed by one subject, ie. a HIT """
    __tablename__ = 'hits'
    __table_args__ = (
        db.UniqueConstraint('project_id', 'name'),
    )

    id = db.Column(db.LargeBinary, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'))
    # backref projec

    instances = db.relationship(
        "HITInstance", backref='hit', cascade="all, delete")
    taskspecs = db.relationship(
        "TaskSpec", secondary=hits_taskspecs, backref='hits', cascade="all, delete")

    name = db.Column(db.String)
    type = db.Column(db.String)
    extra = db.Column(db.JSON)
    interface = db.Column(db.JSON)

    def __init__(self, id, project_id, name, type, interface={}, extra=None, tasks=[], **kwargs):
        # hashstr = HIT.get_hashstr(hashstr, id)
        self.id = sha256(f'{id}_{project_id}_{app.config["COVFEE_SECRET_KEY"]}'.encode()).digest()
        self.name = name
        self.type = type

        self.interface = interface

        task_specs = []
        for i, spec in enumerate(tasks):
            if 'name' not in spec:
                spec['name'] = str(i)
            spec['order'] = i
            task_specs.append(TaskSpec(**spec))
        self.taskspecs = task_specs

        if extra is not None:
            if 'url' in extra and extra['url'][:4] != 'http':
                extra['url'] = os.path.join(app.config['PROJECT_WWW_URL'], extra['url'])
        self.extra = extra

    def get_hashstr(self, id):
        return self.id.hex() + id

    def instantiate(self):
        # insert multiple hits/URLs according to the repeat param
        # for annotation hits, tasks belong to instances
        # for timeline hits, tasks belong to HITs
        # instances are always created
        instance = HITInstance(
            id=sha256(self.get_hashstr(f'instance{len(self.instances)}').encode()).digest(),
            submitted=False,
            taskspecs=self.taskspecs
        )
        self.instances.append(instance)
        return

    def as_dict(self, with_project=True, with_instances=False, with_instance_tasks=False):
        hit_dict = {c.name: getattr(self, c.name)
                    for c in self.__table__.columns}
        hit_dict['id'] = hit_dict['id'].hex()

        if with_instances:
            hit_dict['instances'] = [instance.as_dict(
                with_tasks=with_instance_tasks) for instance in self.instances]

        if with_project:
            hit_dict['project'] = self.project.as_dict()
        del hit_dict['project_id']

        return hit_dict


class HITInstance(db.Model):
    """ Represents an instance of a HIT, to be performed by one user """
    __tablename__ = 'hitinstances'

    id = db.Column(db.LargeBinary, primary_key=True)
    # id used for visualization
    preview_id = db.Column(db.LargeBinary, unique=True)
    hit_id = db.Column(db.LargeBinary, db.ForeignKey('hits.id'))
    # backref hit

    tasks = db.relationship("Task", backref='hitinstance', cascade="all, delete")

    submitted = db.Column(db.Boolean)

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

    def get_completion_code(self):
        return sha256((self.id.hex() + app.config['COVFEE_SECRET_KEY']).encode()).digest().hex()[:12]

    def as_dict(self, with_tasks=False, with_response_info=False):
        instance_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}
        hit_dict = self.hit.as_dict()

        instance_dict['id'] = instance_dict['id'].hex()
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
            instance_dict['completion_code'] = self.get_completion_code()

        return instance_dict

    def stream_download(self, z, base_path, csv=False):
        tasks = self.tasks

        for task in tasks:
            yield from task.stream_download(z, base_path, csv)
