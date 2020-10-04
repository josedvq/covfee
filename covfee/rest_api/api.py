import json

from flask import request, jsonify, Blueprint
from ..orm import db, app, Project, HIT, HITInstance, Task, TaskResponse, Chunk
from .auth import admin_required
api = Blueprint('api', __name__)

# PROJECTS

# return all projects
@api.route('/projects')
@admin_required
def projects():
    with_hits = request.args.get('with_hits', False)
    res = db.session.query(Project).all()
    return jsonify([p.as_dict(with_hits=with_hits) for p in res])

# return one project
@api.route('/projects/<pid>')
@admin_required
def project(pid):
    with_hits = request.args.get('with_hits')
    res = db.session.query(Project).get(pid)
    return jsonify(res.as_dict(with_hits=with_hits))

# HITS

# return one hit
@api.route('/hits/<hid>')
def hit(hid):
    with_tasks = request.args.get('with_tasks', True)
    res = db.session.query(HIT).get(bytes.fromhex(hid))
    return jsonify(res.as_dict(with_tasks=with_tasks))

# INSTANCES

# return one HIT instance
@api.route('/instances/<iid>')
def instance(iid):
    with_tasks = request.args.get('with_tasks', True)
    res = db.session.query(HITInstance).get(bytes.fromhex(iid))
    return jsonify(res.as_dict(with_tasks=with_tasks))

# submit a hit (when finished)
@api.route('/instances/<iid>/submit', methods=['POST'])
def instance_submit(tid):
    instance = db.session.query(HITInstance).get(bytes.fromhex(tid))
    instance.submitted = True
    db.session.commit()
    return jsonify(instance.as_dict(with_tasks=True))

# TASKS

# create a task attached to an instance
@api.route('/instances/<iid>/tasks/add', methods=['POST'])
def task_add_to_instance(iid):
    instance = db.session.query(HITInstance).get(bytes.fromhex(iid))
    if instance.hit.type != 'annotation':
        return jsonify(msg='Only annotation-type instances can be user-edited.'), 403

    task = Task(**request.json)
    instance.tasks.append(task)
    db.session.commit()
    return jsonify(task.as_dict())

# edit an existing task
@api.route('/tasks/<kid>/edit', methods=['POST'])
def task_edit(kid):
    task = db.session.query(Task).get(int(kid))
    if task.hit:
        return jsonify(msg='Only annotation-type instances can be user-edited.'), 403
    task.name = request.json['name']
    db.session.commit()
    return jsonify(task.as_dict())

# delete an existing task
@api.route('/tasks/<kid>/delete')
def task_delete(kid):
    task = db.session.query(Task).get(int(kid))
    if task.hit:
        return jsonify(msg='Only annotation-type instances can be user-deleted.'), 403
    task.delete()
    db.session.commit()
    return jsonify({'success': True}), 204

# record a response to a task
# task kid may or may not be associated to instance iid
@api.route('/instances/<iid>/tasks/<kid>/submit', methods=['POST'])
def task_submit(iid, kid):
    lastResponse = TaskResponse.query.filter_by(
        hitinstance_id=bytes.fromhex(iid), task_id=int(kid)).order_by(TaskResponse.index.desc()).first()

    if lastResponse is not None and not lastResponse.submitted:
        # there is an open (not submitted) response:
        lastResponse.data = request.json
        lastResponse.submitted = True
        db.session.commit()
        return jsonify(lastResponse.as_dict())

    if lastResponse is None:
        response_index = 0  # first response
    elif lastResponse.submitted:
        response_index = lastResponse+1  # following response

    # no responses have been submitted or only completed responses
    response = TaskResponse(
        task_id=kid,
        hitinstance_id=iid,
        index=response_index,
        data=request.json,
        chunks=[],
        submitted=True)

    db.session.commit()
    return jsonify(response.as_dict())
        

# receive a chunk of a response, for continuous responses
@api.route('/instances/<iid>/tasks/<kid>/chunk', methods=['POST'])
def chunk(iid, kid):
    response = TaskResponse.query.filter_by(hitinstance_id=bytes.fromhex(iid), task_id=int(kid)).order_by(TaskResponse.index.desc()).first()
    # no responses or only submitted responses
    # -> create new response
    if response is None or response.submitted:
        response_index = 0
        # increment index of last response
        if response is not None and response.submitted:
            response_index = response.index + 1

        response = TaskResponse(
            task_id=kid,
            hitinstance_id=iid,
            index=response_index,
            submitted=False,
            chunks=[])

    chunk = Chunk(**request.json)
    response.chunks.append(chunk)
    db.session.commit()
    return jsonify({'success': True}), 201
