from io import BytesIO

import zipstream
from flask import request, jsonify, Blueprint, send_file, make_response, Response,\
     stream_with_context, redirect, current_app as app
from sqlalchemy.orm.attributes import flag_modified

from ..orm import Project, HIT, HITInstance, Task, TaskResponse
from .auth import admin_required
from covfee.server.orm.task import TaskSpec
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
    res = app.session.query(Project).all()
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
    res = app.session.query(Project).get(bytes.fromhex(pid))
    return jsonify_or_404(res, with_hits=with_hits, with_instances=with_instances, with_config=True)


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
    project = app.session.query(Project).get(bytes.fromhex(pid))
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

    project = app.session.query(Project).get(bytes.fromhex(pid))
    if project is None:
        return {'msg': 'not found'}, 404

    def generator():
        z = zipstream.ZipFile(mode='w', compression=zipstream.ZIP_DEFLATED)
        for chunk in project.stream_download(z, './', csv=is_csv):
            yield chunk
        yield from z

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
    with_instances = request.args.get('with_instances', False)
    with_instance_tasks = request.args.get('with_instance_tasks', False)
    res = app.session.query(HIT).get(bytes.fromhex(hid))
    return jsonify_or_404(res,
                          with_instances=with_instances,
                          with_instance_tasks=with_instance_tasks)

@api.route('/hits/<hid>/edit', methods=['POST'])
@admin_required
def hit_edit(hid):
    """ Edits the hit configuration using the received config.
    """
    hit = app.session.query(HIT).get(bytes.fromhex(hid))
    if hit is None:
        return jsonify({'msg': 'invalid hit'}), 400

    hit.update(request.json)
    app.session.commit()
    return jsonify_or_404(hit, with_instances=False, with_config=True)

# INSTANCES

# return one HIT instance
@api.route('/instances/<iid>')
def instance(iid):
    with_tasks = request.args.get('with_tasks', True)
    with_response_info = request.args.get('with_response_info', True)
    res = app.session.query(HITInstance).get(bytes.fromhex(iid))
    return jsonify_or_404(res, with_tasks=with_tasks, 
                          with_response_info=with_response_info)


@api.route('/instance-previews/<iid>')
def instance_preview(iid):
    res = HITInstance.query.filter_by(preview_id=bytes.fromhex(iid)).first()
    return jsonify_or_404(res, with_tasks=True, with_response_info=False)


# submit a hit (when finished)
@api.route('/instances/<iid>/submit', methods=['POST'])
def instance_submit(iid):
    instance = app.session.query(HITInstance).get(bytes.fromhex(iid))
    if instance is None:
        return jsonify({'msg': 'invalid instance'}), 400
    is_submitted, err = instance.submit()

    if not is_submitted:
        return jsonify({'msg': err}), 400

    app.session.commit()
    return jsonify(instance.as_dict(with_tasks=False))


@api.route('/hits/<hid>/instances/add')
def instance_add(hid):
    """Adds an instance (link) to the HIT

    Args:
        hid (str): HIT ID

    Returns:
        json: the added instance object
    """
    num_instances = request.args.get('num_instances', 1)
    hit = app.session.query(HIT).get(bytes.fromhex(hid))
    if hit is None:
        return jsonify({'msg': 'not found'}), 404

    for i in range(0, num_instances):
        hit.instantiate()

    app.session.commit()
    with_instances = request.args.get('with_instances', True)
    with_instance_tasks = request.args.get('with_instance_tasks', False)

    return jsonify_or_404(hit,
                          with_instances=with_instances,
                          with_instance_tasks=with_instance_tasks)


@api.route('/hits/<hid>/instances/add_and_redirect')
def instance_add_and_redirect(hid):
    """Adds an instance (link) to the HIT and redirects to the new URL.

    Args:
        hid (str): HIT ID
    """
    hit = app.session.query(HIT).get(bytes.fromhex(hid))
    if hit is None:
        return jsonify({'msg': 'not found'}), 404

    instance = hit.instantiate()
    if instance is None:
        return jsonify({'msg': 'unable to add instance.'}), 400
    instance.set_extra(request.args)

    app.session.commit()
    return redirect(instance.get_url(), 302)


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

    instance = app.session.query(HITInstance).get(bytes.fromhex(iid))
    if instance is None:
        return jsonify({'msg': 'not found'}), 404

    def generator():
        z = zipstream.ZipFile(mode='w', compression=zipstream.ZIP_DEFLATED)
        for chunk in instance.stream_download(z, './', csv=is_csv):
            yield chunk
        yield from z

    response = Response(stream_with_context(generator()), mimetype='application/zip')
    response.headers['Content-Disposition'] = 'attachment; filename={}'.format('results.zip')
    return response


# TASKS

# create a task attached to an instance
@api.route('/instances/<iid>/tasks/add', methods=['POST'])
def task_add_to_instance(iid):
    instance = app.session.query(HITInstance).get(bytes.fromhex(iid))
    if instance is None:
        return jsonify({'msg': 'invalid instance'}), 400

    task_spec = TaskSpec(**request.json, editable=True)
    task = task_spec.instantiate()
    instance.tasks.append(task)
    app.session.commit()
    return jsonify(task.as_dict())


# edit an existing task
@api.route('/tasks/<kid>/edit', methods=['POST'])
def task_edit(kid):
    task = app.session.query(Task).get(int(kid))
    if task is None:
        return jsonify({'msg': 'invalid task'}), 400
    spec = task.spec
    if not spec.editable:
        return jsonify(msg='Task cannot be user-edited.'), 403
    spec.spec['name'] = request.json['name']
    flag_modified(spec, 'spec')
    app.session.commit()
    return jsonify(task.as_dict())


# delete an existing task
@api.route('/tasks/<kid>/delete')
def task_delete(kid):
    task = app.session.query(Task).get(int(kid))
    if task is None:
        return jsonify({'msg': 'invalid task'}), 400
    if not task.editable:
        return jsonify(msg='Task cannot be user-deleted.'), 403
    app.session.delete(task)
    app.session.commit()
    return jsonify({'success': True}), 200


@api.route('/tasks/<kid>/response')
def response(kid):
    ''' Will return the last response for a task
    '''
    task = app.session.query(Task).get(int(kid))
    if task is None:
        return jsonify({'msg': 'invalid task'}), 400

    responses = task.responses
    submitted = request.args.get('submitted', None)
    if submitted is not None:
        responses = [r for r in responses if r.submitted == bool(submitted)]

    if len(responses) == 0:
        return jsonify(msg='No submitted responses found.'), 403

    response_dict = responses[-1].as_dict()
    return jsonify(response_dict)





@api.route('/tasks/<kid>/make_response', methods=['POST'])
def make_response(kid):
    submit = bool(request.args.get('submit', False))

    task = app.session.query(Task).get(int(kid))
    if task is None:
        return jsonify({'msg': 'invalid task'}), 400

    response = task.add_response()
    if request.json:
        response.update(request.json)
    if submit:
        response.submit()
    app.session.commit()
    return jsonify(response.as_dict())


# record a response to a task
@api.route('/responses/<rid>/submit', methods=['POST'])
def response_submit(rid):
    response = app.session.query(TaskResponse).get(int(rid))
    if response is None:
        return jsonify({'msg': 'invalid response'}), 400

    res = response.submit(request.json)    
    app.session.commit()
    return jsonify(res)
