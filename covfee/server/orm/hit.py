import os
import hmac
import hashlib
import datetime
import random

from flask import current_app as app
from werkzeug.datastructures import MultiDict

from .db import db
from hashlib import sha256
from covfee.server.orm.task import TaskSpec

hits_taskspecs = db.Table(
    'hits_taskspecs',
    db.Column('hit_id', db.Integer, db.ForeignKey('hits.id'), primary_key=True),
    db.Column('taskspec_id', db.Integer, db.ForeignKey('taskspecs.id'), primary_key=True))


class HIT(db.Model):
    ''' Represents a set of tasks to be completed by one subject, ie. a HIT 
        - A HIT belongs to a project and has a list of Task specifications.
        - A HIT is abstract and must be instantiated into a HIT instance to be solved by a user. 
    '''
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

    # shared_tasks = db.relationship(
    #     "Task", backref='hit', cascade="all, delete")

    name = db.Column(db.String)
    extra = db.Column(db.JSON)
    interface = db.Column(db.JSON)
    config = db.Column(db.JSON)

    created_at = db.Column(db.DateTime, default=datetime.datetime.now)
    updated_at = db.Column(db.DateTime, onupdate=datetime.datetime.now)

    def __init__(self, id, project_id, name, tasks, interface=None, extra=None, config=None, **kwargs):
        if interface is None:
            interface = {}
        if config is None:
            config = {}

        self.id = sha256(f'{id}_{project_id}_{app.config["COVFEE_SECRET_KEY"]}'.encode()).digest()
        self.name = name

        self.interface = interface

        if extra is not None:
            if 'url' in extra and extra['url'][:4] != 'http':
                extra['url'] = os.path.join(app.config['PROJECT_WWW_URL'], extra['url'])
        self.extra = extra

        self.config = config
        self.config['maxInstances'] = self.config.get('maxInstances', 100)

        self.set_task_specs(tasks)

    def update(self, params):
        self.config = {**self.config, **params['config']}

    def set_task_specs(self, tasks_spec):
        ''' This method will separate the tasks specification into a generator specification
            that will specify how a HIT is instantiated (incl shuffling of the tasks) and refers to tasks via IDs
            and a list of tasks, containing only covfee tasks (excl shufflers), and whose index in the list match
            the IDs in the generator.
        '''
        
        task_list = []
        state = {"task_idx": 0}

        # traverse the tasks_spec looking for covfee tasks
        def dfs(ts):
            for i, spec in enumerate(ts):
                if spec['type'] == 'shuffle':
                    for child_ts in spec['tasks']:
                        dfs(child_ts)
                else:
                    task_list.append(spec)
                    ts[i] = state['task_idx']
                    state['task_idx'] += 1

        # recurse starting at the root HIT tasks spec
        dfs(tasks_spec)

        # store the covfee tasks specifications
        for i, spec in enumerate(task_list):
            if 'name' not in spec:
                spec['name'] = f'Task {i}'
            self.taskspecs.append(TaskSpec(**spec))
        
        # store the generator specification
        self.config['generator'] = tasks_spec

    def get_hashstr(self, id):
        ''' Used to generate the string to be hashed as an ID to the HIT instances of this HIT.
        '''
        return self.id.hex() + id

    def instantiate(self):
        ''' Generates a new hit instance/URL by instantiating the HIT.
            Task specs are arranged per config.generator and passed to TaskInstance in final order
        '''
        if(len(self.instances) >= self.config['maxInstances']):
            return None

        task_specs = []
        def recursive_generate(gen_list):
            ''' Recursive method that will DFS the generator structure.
                - new tasks are added to task_specs when an integer ID is found
                - the recursive step is taken on special objects (eg. type='shuffle')
            '''
            for elem in gen_list:
                if type(elem) == int:
                    task_specs.append(self.taskspecs[elem])
                elif type(elem) == dict:
                    if elem['type'] == 'shuffle':
                        idxs = random.sample(range(len(elem['tasks'])), len(elem['tasks']))
                        shuffled = [elem['tasks'][i] for i in idxs]
                        for child_gen_list in shuffled:
                            recursive_generate(child_gen_list)
                    else:
                        raise Exception(f'Unrecognized element type property "{elem["type"]}" in generator.')
                else:
                    raise Exception(f'Unrecognized element type "{str(type(elem))}" in generator.')

        # start recursion on the root generator
        recursive_generate(self.config['generator'])    

        instance = HITInstance(
            id=sha256(self.get_hashstr(f'instance{len(self.instances)}').encode()).digest(),
            submitted=False,
            taskspecs=task_specs
        )
        self.instances.append(instance)
        return instance

    def get_api_url(self):
        return f'{app.config["API_URL"]}/hits/{self.id.hex()}'

    def as_dict(self, with_project=True, with_instances=False, with_instance_tasks=False, with_config=False):
        hit_dict = {c.name: getattr(self, c.name)
                    for c in self.__table__.columns}
        hit_dict['id'] = hit_dict['id'].hex()
        hit_dict['api_url'] = self.get_api_url()
        hit_dict['generator_url'] = self.get_generator_url()

        if with_instances:
            hit_dict['instances'] = [instance.as_dict(
                with_tasks=with_instance_tasks) for instance in self.instances]

        if with_project:
            hit_dict['project'] = self.project.as_dict()
        del hit_dict['project_id']

        if not with_config:
            del hit_dict['config']

        return hit_dict
    
    def get_generator_url(self):
        ''' URL to the generator endpoint, which will instantiate the HIT and redirect the user to the new instance
        For use in linking from crowdsourcing websites (eg. Prolific)
        '''
        return f'{app.config["API_URL"]}/hits/{self.id.hex():s}/instances/add_and_redirect'


class HITInstance(db.Model):
    ''' Represents an instance of a HIT, to be solved by one user
        - one HIT instance maps to one URL that can be sent to a participant to access and solve the HIT.
        - a HIT instance is specified by the abstract HIT it is an instance of.
        - a HIT instance is linked to a list of tasks (instantiated task specifications),
        which hold the responses for the HIT
    '''
    __tablename__ = 'hitinstances'

    id = db.Column(db.LargeBinary, primary_key=True)
    # id used for visualization
    preview_id = db.Column(db.LargeBinary, unique=True)
    hit_id = db.Column(db.LargeBinary, db.ForeignKey('hits.id'))
    # backref hit

    tasks = db.relationship("Task", backref='hitinstance', cascade="all, delete")
    submitted = db.Column(db.Boolean)
    queryParams = db.Column(db.JSON)

    created_at = db.Column(db.DateTime, default=datetime.datetime.now)
    updated_at = db.Column(db.DateTime, onupdate=datetime.datetime.now)
    submitted_at = db.Column(db.DateTime)

    def __init__(self, id, taskspecs=[], submitted=False):
        self.id = id
        self.preview_id = sha256((id + 'preview'.encode())).digest()
        self.submitted = submitted
        self.queryParams = {}

        for spec in taskspecs:
            self.tasks.append(spec.instantiate())

    def get_api_url(self):
        return f'{app.config["API_URL"]}/instances/{self.id.hex():s}'

    def get_url(self):
        return f'{app.config["APP_URL"]}/hits/{self.id.hex():s}'

    def get_preview_url(self):
        return f'{app.config["APP_URL"]}/hits/{self.preview_id.hex():s}?preview=1'

    def get_completion_info(self):
        completion = {
            'completionCode': self.hit.config.get('completionCode', sha256((self.id.hex() + app.config['COVFEE_SECRET_KEY']).encode()).digest().hex()[:12]),
            'redirectName': self.hit.config.get('redirectName', None),
            'redirectUrl': self.hit.config.get('redirectUrl', None)
        }
        return completion

    def get_hmac(self):
        h = hmac.new(app.config['COVFEE_SECRET_KEY'].encode('utf-8'), self.id, hashlib.sha256 )
        return h.hexdigest()

    def set_extra(self, params: MultiDict):
        self.queryParams = {
            **self.queryParams,
            **params
        }

    def submit(self):
        if any([(task.spec.required and not task.has_valid_response()) for task in self.tasks]):
            # cant submit if at least one required task has no valid submissions
            return False, 'Some required tasks have no valid responses.'
        else:
            self.submitted = True
            self.submitted_at = datetime.datetime.now()
            return True, None

    def as_dict(self, with_tasks=False, with_response_info=False):
        instance_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}
        hit_dict = self.hit.as_dict()

        instance_dict['id'] = instance_dict['id'].hex()
        instance_dict['token'] = self.get_hmac()
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
            instance_dict['completionInfo'] = self.get_completion_info()

        return instance_dict

    def stream_download(self, z, base_path, csv=False):
        for i, task in enumerate(self.tasks):
            yield from task.stream_download(z, base_path, i, csv)

