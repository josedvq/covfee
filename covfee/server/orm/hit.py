import shutil
import os
from urllib.parse import urljoin

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

    id = db.Column(db.LargeBinary, primary_key=True)
    type = db.Column(db.String)
    name = db.Column(db.String)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'))
    extra = db.Column(db.JSON)
    instances = db.relationship("HITInstance", backref='hit', cascade="all, delete")
    tasks = db.relationship("Task", secondary=hits_tasks, backref='hits', cascade="all, delete", order_by='Task.order.asc(),Task.created_at.asc()')
    interface = db.Column(db.JSON)

    def __init__(self, id, hashstr, type, repeat=1, tasks=[], **kwargs):
        hashstr = HIT.get_hashstr(hashstr, id)
        self.id = sha256(hashstr.encode()).digest()
        self.type = type

        task_objects = []
        for i, task in enumerate(tasks):
            if 'name' not in task:
                task['name'] = str(i)
            task['order'] = i
            task_objects.append(Task(**task))
        self.tasks = task_objects

        self.update(id=id, hashstr=hashstr, repeat=repeat, **kwargs)

    def update(self, id, hashstr, name, repeat=1, extra=None, interface={}, **kwargs):
        hashstr = HIT.get_hashstr(hashstr, id)
        self.name = name
        self.interface = interface

        if extra is not None:
            if 'url' in extra and extra['url'][:4] != 'http':
                extra['url'] = os.path.join(
                    app.config['MEDIA_URL'], extra['url'])
        self.extra = extra

        # insert multiple hits/URLs according to the repeat param
        # for annotation hits, tasks belong to instances
        # for timeline hits, tasks belong to HITs
        # instances are always created
        for j in range(len(self.instances), repeat):
            self.instances.append(HITInstance(
                id=sha256(f'{hashstr}_{j:d}'.encode()).digest(),
                submitted=False,
                tasks=[]
            ))
        # for i, task_dict in enumerate(tasks_dict):
        #     task_dict['order'] = i

        #     if 'name' not in task_dict:
        #         task_dict['name'] = str(i)

        #     tasks_with_name = [t for t in self.tasks if t.name == task_dict['name']]
        #     if len(tasks_with_name):
        #         # the task exists already
        #         task = tasks_with_name[0]
        #         task.update(**task_dict)
        #     else:
        #         # append the task
        #         self.tasks.append(Task(**task_dict))

    @staticmethod
    def get_hashstr(project_hashstr, id):
        return project_hashstr + id

    @staticmethod
    def get_id(project_hashstr, id):
        return sha256(HIT.get_hashstr(project_hashstr, id).encode()).digest()

    def as_dict(self, with_project=True, with_tasks=False, with_instances=False, with_instance_tasks=False):
        hit_dict = {c.name: getattr(self, c.name)
                    for c in self.__table__.columns}
        hit_dict['id'] = hit_dict['id'].hex()

        if with_tasks:
            hit_dict['tasks'] = [task.as_dict(editable=False) for task in self.tasks]

        if with_instances:
            hit_dict['instances'] = [instance.as_dict(
                with_tasks=with_instance_tasks) for instance in self.instances]

        if with_project:
            hit_dict['project'] = self.project.as_dict()
        del hit_dict['project_id']

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

    id = db.Column(db.LargeBinary, primary_key=True)
    # id used for visualization
    preview_id = db.Column(db.LargeBinary, unique=True)
    hit_id = db.Column(db.Integer, db.ForeignKey('hits.id'))
    tasks = db.relationship("Task", secondary=hitistances_tasks, backref='hitinstances', cascade="delete, all", order_by='Task.order.asc(),Task.created_at.asc()')
    responses = db.relationship("TaskResponse", backref='hitinstance', lazy='dynamic')
    submitted = db.Column(db.Boolean)

    def __init__(self, id, tasks=[], submitted=False):
        self.id = id
        self.preview_id = sha256((id + 'preview'.encode())).digest()
        self.submitted = submitted

        task_objects = [Task.from_dict(
            task
        ) for task in tasks]
        self.tasks = task_objects

    def get_api_url(self):
        return f'{app.config["API_URL"]}/instances/{self.id.hex():s}'

    def get_url(self):
        return f'{app.config["APP_URL"]}/hits/{self.id.hex():s}'

    def get_preview_url(self):
        return f'{app.config["APP_URL"]}/hits/{self.preview_id.hex():s}?preview=1'

    def get_completion_code(self):
        return sha256((self.id.hex() + app.config['COVFEE_SALT']).encode()).digest().hex()[:12]

    def as_dict(self, with_tasks=False, with_responses=False):
        instance_dict = {c.name: getattr(self, c.name)
                         for c in self.__table__.columns}
        hit_dict = self.hit.as_dict(with_tasks=with_tasks)
        instance_dict['id'] = instance_dict['id'].hex()
        instance_dict['hit_id'] = instance_dict['hit_id'].hex()
        instance_dict['preview_id'] = instance_dict['preview_id'].hex()

        # merge hit and instance dicts
        instance_dict = {**hit_dict, **instance_dict}

        if with_tasks:
            # join instance and HIT tasks
            instance_tasks = [task.as_dict(editable=True) for task in self.tasks]
            instance_dict['tasks'] = [*hit_dict['tasks'], *instance_tasks]

            if with_responses:
                for task in instance_dict['tasks']:
                    task_id = task['id']
                    # query the latest response
                    # only include submitted responses
                    lastResponse = self.responses.filter_by(
                        task_id=task_id, submitted=True).order_by(TaskResponse.index.desc()).first()
                    if lastResponse is None:
                        task['response'] = None
                    else:
                        task['response'] = lastResponse.as_dict()

        if self.submitted:
            instance_dict['completion_code'] = self.get_completion_code()

        return instance_dict

    def make_download(self, base_dir=None, csv=False):
        if base_dir is None:
            base_dir = app.config['TMP_PATH']
            
        # create a folder to store all the files
        dirpath = os.path.join(base_dir, self.id.hex())
        if os.path.exists(dirpath) and os.path.isdir(dirpath):
            shutil.rmtree(dirpath)

        os.mkdir(dirpath)

        # go over all submitted responses to this HIT instance
        responses = self.responses.filter_by(submitted=True).all()

        if len(responses) == 0:
            return None, 0

        num_success = 0
        for response in responses:
            if csv:
                res = response.write_csv(dirpath)
            else:
                res = response.write_json(dirpath)
            num_success += int(res)

        return dirpath, num_success
