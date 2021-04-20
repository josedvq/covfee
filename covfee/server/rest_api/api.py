from flask import request, jsonify, Blueprint, send_file, make_response, Response, stream_with_context
from ..orm import db, Project, HIT, HITInstance, Task, TaskResponse, Chunk
from .auth import admin_required
from io import BytesIO
import zipstream
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
    """Lists all the projects currently in covfee

    Returns:
        [type]: list of project objects
    """
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
    """Returns a project object

    Args:
        pid (str): project ID
    """
    with_hits = request.args.get('with_hits', False)
    with_instances = request.args.get('with_instances', False)
    res = db.session.query(Project).get(bytes.fromhex(pid))
    return jsonify_or_404(res, with_hits=with_hits, with_instances=with_instances)


@api.route('/projects/<pid>/csv')
@admin_required
def project_csv(pid):
    """Creates a CSV file with links and completion codes for HITs
    This file can be used in human intelligence marketplaces or to directly send the 
    links in it to study participants.

    Args:
        pid ([str]): ID of the project

    Returns:
        [type]: CSV file with a hit instance per line
    """
    project = db.session.query(Project).get(bytes.fromhex(pid))
    if project is None:
        return {'msg': 'not found'}, 404
    else:
        df = project.get_dataframe()
        res = make_response(df.to_csv())
        res.headers["Content-Disposition"] = "attachment; filename=export.csv"
        res.headers["Content-Type"] = "text/csv"
        return res


@api.route('/projects/<pid>/download')
@admin_required
def project_download(pid):
    """Generates a downloadable with all the responses in a project.
    It gathers the responses for all hit instances in the project
    This endpoint migh be slow for large projects.

    Args:
        pid (str): project ID

    Returns:
        [type]: stream response with a compressed archive. 204 if the project has no responses
    """
    is_csv = bool(request.args.get('csv', False))

    project = db.session.query(Project).get(bytes.fromhex(pid))
    if project is None:
        return {'msg': 'not found'}, 404

    def generator():
        z = zipstream.ZipFile(mode='w', compression=zipstream.ZIP_DEFLATED)
        for chunk in project.stream_download(z, './', csv=is_csv):
            yield chunk

    response = Response(stream_with_context(generator()), mimetype='application/zip')
    response.headers['Content-Disposition'] = 'attachment; filename={}'.format('results.zip')
    return response


# HITS
# return one hit
@api.route('/hits/<hid>')
def hit(hid):
    """Returns a HIT specification.

    Args:
        hid (str): hit ID
    """ 
    with_tasks = request.args.get('with_tasks', True)
    with_instances = request.args.get('with_instances', False)
    with_instance_tasks = request.args.get('with_instance_tasks', False)
    res = db.session.query(HIT).get(bytes.fromhex(hid))
    return jsonify_or_404(res,
                          with_tasks=with_tasks, 
                          with_instances=with_instances, 
                          with_instance_tasks=with_instance_tasks)


@api.route('/hits/<hid>/instances/add')
def instance_add(hid):
    """Adds an instance (link) to the HIT

    Args:
        hid (str): HIT ID

    Returns:
        json: the added instance object
    """
    num_instances = request.args.get('num_instances', 1)
    hit = db.session.query(HIT).get(bytes.fromhex(hid))
    if hit is None:
        return {'msg': 'not found'}, 404

    hit.add_instances(num_instances)

    with_tasks = request.args.get('with_tasks', True)
    with_instances = request.args.get('with_instances', True)
    with_instance_tasks = request.args.get('with_instance_tasks', False)

    return jsonify_or_404(hit,
                          with_tasks=with_tasks,
                          with_instances=with_instances,
                          with_instance_tasks=with_instance_tasks)


# INSTANCES
# return one HIT instance
@api.route('/instances/<iid>')
def instance(iid):
    with_tasks = request.args.get('with_tasks', True)
    with_response_info = request.args.get('with_response_info', True)
    res = db.session.query(HITInstance).get(bytes.fromhex(iid))
    return jsonify_or_404(res, with_tasks=with_tasks, with_response_info=with_response_info)


@api.route('/instance-previews/<iid>')
def instance_preview(iid):
    res = HITInstance.query.filter_by(preview_id=bytes.fromhex(iid)).first()
    return jsonify_or_404(res, with_tasks=True, with_responses=False)


# submit a hit (when finished)
@api.route('/instances/<iid>/submit', methods=['POST'])
def instance_submit(iid):
    instance = db.session.query(HITInstance).get(bytes.fromhex(iid))
    if instance is None:
        return jsonify({'msg': 'invalid instance'}), 400
    instance.submitted = True

    return jsonify(instance.as_dict(with_tasks=True))


@api.route('/instances/<iid>/download')
@admin_required
def instance_download(iid):
    """Generates a downloadable file with the results for a task instance
    It bundles together the results of individual tasks into a zip archive

    Args:
        iid ([type]): instance id

    Returns:
        [type]: zip file with task results
    """
    is_csv = request.args.get('csv', False)

    instance = db.session.query(HITInstance).get(bytes.fromhex(iid))
    if instance is None:
        return jsonify({'msg': 'not found'}), 404

    def generator():
        z = zipstream.ZipFile(mode='w', compression=zipstream.ZIP_DEFLATED)
        for chunk in instance.stream_download(z, './', csv=is_csv):
            yield chunk

    response = Response(stream_with_context(generator()), mimetype='application/zip')
    response.headers['Content-Disposition'] = 'attachment; filename={}'.format('results.zip')
    return response


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
    return jsonify(task.as_dict(editable=True))


# edit an existing task
@api.route('/tasks/<kid>/edit', methods=['POST'])
def task_edit(kid):
    task = db.session.query(Task).get(int(kid))
    if task is None:
        return jsonify({'msg': 'invalid task'}), 400
    if task.hits:
        return jsonify(msg='Only annotation-type instances can be user-edited.'), 403
    task.name = request.json['name']
    db.session.commit()
    return jsonify(task.as_dict(editable=True))


# delete an existing task
@api.route('/tasks/<kid>/delete')
def task_delete(kid):
    task = db.session.query(Task).get(int(kid))
    if task is None:
        return jsonify({'msg': 'invalid task'}), 400
    if task.hits:
        return jsonify(msg='Only annotation-type instances can be user-deleted.'), 403
    db.session.delete(task)
    db.session.commit()
    return jsonify({'success': True}), 200


@api.route('/instances/<iid>/tasks/<kid>/responses')
def response(iid, kid):
    lastResponse = TaskResponse.query.filter_by(
        hitinstance_id=bytes.fromhex(iid), 
        task_id=int(kid), 
        submitted=True).order_by(TaskResponse.index.desc()).first()

    if lastResponse is None:
        return jsonify(msg='No submitted responses found.'), 403

    response_dict = lastResponse.as_dict()
    return jsonify(response_dict)


@api.route('/instances/<iid>/tasks/<kid>/chunks', methods=['GET'])
def query_chunks(iid, kid):
    response = TaskResponse.query.filter_by(
        hitinstance_id=bytes.fromhex(iid),
        task_id=int(kid),
        submitted=True).order_by(TaskResponse.index.desc()).first()

    if response is None:
        return jsonify(msg='No submitted responses found.'), 403

    print(response.id)

    chunk_bytes = response.pack_chunks()
    return send_file(BytesIO(chunk_bytes), mimetype='application/octet-stream'), 200


# record a response to a task
# task kid may or may not be associated to instance iid
@api.route('/instances/<iid>/tasks/<kid>/submit', methods=['POST'])
def response_submit(iid, kid):
    task = db.session.query(Task).get(int(kid))
    lastResponse = task.responses.filter_by(hitinstance_id=bytes.fromhex(iid)).order_by(TaskResponse.index.desc()).first()

    if lastResponse is not None and not lastResponse.submitted:
        # there is an open (not submitted) response:
        lastResponse.data = request.json
        lastResponse.submitted = True
        task.has_unsubmitted_response = False

        db.session.commit()
        return jsonify(lastResponse.as_dict())

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
    task.has_unsubmitted_response = False

    db.session.add(response)
    db.session.commit()
    return jsonify(response.as_dict())


# receive a chunk of a response, for continuous responses
@api.route('/instances/<iid>/tasks/<kid>/chunk', methods=['POST'])
def response_chunk(iid, kid):
    sent_index = int(request.args.get('index'))
    length = int(request.args.get('length'))

    task = db.session.query(Task).get(int(kid))
    response = task.responses.filter_by(hitinstance_id=bytes.fromhex(iid)).order_by(TaskResponse.index.desc()).first()

    # no responses or only submitted responses
    # -> create new response
    if response is None or response.submitted:
        print('no responses or only submitted responses')
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
        task.has_unsubmitted_response = True

    print(f'response id is {response.id}')

    # if there is a previous chunk with the same index, overwrite it
    if response.chunks.count() > 0:
        chunk = next((chunk for chunk in response.chunks if chunk.index == sent_index), None)
        if chunk is not None:
            print('overwriting chunk')
            chunk.update(data=request.get_data(), length=length)

            db.session.commit()
            return jsonify({'success': True}), 201

    # no previous chunk with the same index -> append the chunk
    chunk = Chunk(index=sent_index, length=length, data=request.get_data())
    response.chunks.append(chunk)
    db.session.add(response)
    db.session.commit()
    return jsonify({'success': True}), 201
