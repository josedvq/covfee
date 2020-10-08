import json

from flask import request, jsonify, Blueprint, send_from_directory
from ..orm import db, app, Project, HIT, HITInstance, Task, TaskResponse, Chunk
from .auth import admin_required
api = Blueprint('api', __name__)

# PROJECTS
def jsonify_or_404(res, **kwargs):
    if res is None:
        return {'msg': 'not found'}, 404
    else:
        return jsonify(res.as_dict(**kwargs))

# return all projects
@api.route('/projects')
@admin_required
def projects():
    with_hits = request.args.get('with_hits', False)
    res = db.session.query(Project).all()
    if res is None:
        return jsonify([])
    else:
        return jsonify([p.as_dict(with_hits=with_hits) for p in res])

# return one project
@api.route('/projects/<pid>')
@admin_required
def project(pid):
    with_hits = request.args.get('with_hits', False)
    with_instances = request.args.get('with_instances', False)
    res = db.session.query(Project).get(bytes.fromhex(pid))
    return jsonify_or_404(res, with_hits=with_hits, with_instances=with_instances)

# HITS

# return one hit
@api.route('/hits/<hid>')
def hit(hid):
    with_tasks = request.args.get('with_tasks', True)
    with_instances = request.args.get('with_instances', False)
    with_instance_tasks = request.args.get('with_instance_tasks', False)
    res = db.session.query(HIT).get(bytes.fromhex(hid))
    return jsonify_or_404(res,
        with_tasks=with_tasks, 
        with_instances=with_instances, 
        with_instance_tasks=with_instance_tasks)

# INSTANCES

# return one HIT instance
@api.route('/instances/<iid>')
def instance(iid):
    with_tasks = request.args.get('with_tasks', True)
    with_responses = request.args.get('with_responses', True)
    res = db.session.query(HITInstance).get(bytes.fromhex(iid))
    return jsonify_or_404(res, with_tasks=with_tasks, with_responses=with_responses)

# submit a hit (when finished)
@api.route('/instances/<iid>/submit', methods=['POST'])
def instance_submit(iid):
    instance = db.session.query(HITInstance).get(bytes.fromhex(iid))
    if instance is None:
        return jsonify({'msg': 'invalid instance'}), 400
    instance.submitted = True
    db.session.commit()
    return jsonify(instance.as_dict(with_tasks=True))


@api.route('/instances/<iid>/download')
@admin_required
def instance_download(iid):
    instance = db.session.query(HITInstance).get(bytes.fromhex(iid))
    if instance is None:
        return jsonify({'msg': 'not found'}), 404
    instance.make_json_download()
    return send_from_directory(app.config['TMP_PATH'], 'download.zip', as_attachment=True)

# TASKS

# create a task attached to an instance
@api.route('/instances/<iid>/tasks/add', methods=['POST'])
def task_add_to_instance(iid):
    instance = db.session.query(HITInstance).get(bytes.fromhex(iid))
    if instance is None:
        return jsonify({'msg': 'invalid instance'}), 400
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
    if task is None:
        return jsonify({'msg': 'invalid task'}), 400
    if task.hit:
        return jsonify(msg='Only annotation-type instances can be user-edited.'), 403
    task.name = request.json['name']
    db.session.commit()
    return jsonify(task.as_dict())

# delete an existing task
@api.route('/tasks/<kid>/delete')
def task_delete(kid):
    task = db.session.query(Task).get(int(kid))
    if task is None:
        return jsonify({'msg': 'invalid task'}), 400
    if task.hit:
        return jsonify(msg='Only annotation-type instances can be user-deleted.'), 403
    task.delete()
    db.session.commit()
    return jsonify({'success': True}), 204


@api.route('/instances/<iid>/tasks/<kid>/responses')
def response(iid, kid):
    with_chunk_data = request.args.get('with_chunk_data', True)
    lastResponse = TaskResponse.query.filter_by(
        hitinstance_id=bytes.fromhex(iid), 
        task_id=int(kid), 
        submitted=True).order_by(TaskResponse.index.desc()).first()

    if lastResponse is None:
        return jsonify(msg='No submitted responses found.'), 403

    response_dict = lastResponse.as_dict(with_chunk_data=with_chunk_data)
    response_dict['chunk_data'] = lastResponse.aggregate()
    return jsonify(response_dict)
    
# record a response to a task
# task kid may or may not be associated to instance iid
@api.route('/instances/<iid>/tasks/<kid>/submit', methods=['POST'])
def response_submit(iid, kid):
    with_chunk_data = request.args.get('with_chunk_data', True)
    lastResponse = TaskResponse.query.filter_by(
        hitinstance_id=bytes.fromhex(iid), task_id=int(kid)).order_by(TaskResponse.index.desc()).first()

    if lastResponse is not None and not lastResponse.submitted:
        # there is an open (not submitted) response:
        lastResponse.data = request.json
        lastResponse.submitted = True

        db.session.commit()
        return jsonify(lastResponse.as_dict(with_chunk_data=with_chunk_data))

    if lastResponse is None:
        response_index = 0  # first response
    elif lastResponse.submitted:
        response_index = lastResponse.index+1  # following response

    # no responses have been submitted or only completed responses
    response = TaskResponse(
        task_id=int(kid),
        hitinstance_id=bytes.fromhex(iid),
        index=response_index,
        data=request.json,
        chunks=[],
        submitted=True)

    db.session.commit()
    return jsonify(response.as_dict(with_chunk_data=with_chunk_data))
        

# receive a chunk of a response, for continuous responses
@api.route('/instances/<iid>/tasks/<kid>/chunk', methods=['POST'])
def response_chunk(iid, kid):
    response = TaskResponse.query.filter_by(hitinstance_id=bytes.fromhex(iid), task_id=int(kid)).order_by(TaskResponse.index.desc()).first()
    # no responses or only submitted responses
    # -> create new response
    if response is None or response.submitted:
        response_index = 0
        # increment index of last response
        if response is not None and response.submitted:
            response_index = response.index + 1

        response = TaskResponse(
            task_id=int(kid),
            hitinstance_id=bytes.fromhex(iid),
            index=response_index,
            submitted=False,
            chunks=[])

    chunk = Chunk(**request.json)
    response.chunks.append(chunk)
    db.session.add(response)
    db.session.commit()
    return jsonify({'success': True}), 201
