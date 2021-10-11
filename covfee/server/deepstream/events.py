from ..orm import db
from .. import tasks
from ..tasks.base import BaseCovfeeTask
from flask import current_app as app, session
from covfee.server.orm.task import TaskResponse
from covfee.server.deepstream.deepstream_subscriber import DeepStreamSubscriber

deepstream = DeepStreamSubscriber()

def get_task_object(responseId: int):
    response = db.session.query(TaskResponse).get(responseId)
    if response is None:
        return None
    
    task = response.task
    task_class = getattr(tasks, task.spec.spec['type'], BaseCovfeeTask)
    task_object = task_class(response=response)
    return task_object

@deepstream.on('first-join')
def on_first_join(id):
    ''' Called when the first visitor joins a task
    '''
    print('first-join')
    task_object = get_task_object(id)
    task_object.on_first_join()

@deepstream.on('last-leave')
def on_last_leave(id):
    ''' Called when the last visitor leaves a task
    '''
    task_object = get_task_object(id)
    task_object.on_last_leave()

@deepstream.on('join')
def on_join(id):
    ''' Called when a visitor joins a task
    '''
    pass

@deepstream.on('leave')
def on_leave(id):
    ''' Called when a visitor leaves a task
    '''
    pass
