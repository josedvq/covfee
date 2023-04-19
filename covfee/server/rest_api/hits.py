from flask import request, jsonify, redirect, Response,\
     stream_with_context, current_app as app
import zipstream

from .api import api
from .auth import admin_required
from .utils import jsonify_or_404
from ..orm import HITSpec, HITInstance, TaskSpec

# HITS
# return one hit
@api.route('/hits/<hid>')
def hit(hid):
    """Returns a HIT specification.

    Args:
        hid (str): hit ID
    """
    with_instances = request.args.get('with_instances', False)
    with_instance_nodes = request.args.get('with_instance_nodes', False)
    res = app.session.query(HITSpec).get(int(hid))
    return jsonify_or_404(res,
                          with_instances=with_instances,
                          with_instance_nodes=with_instance_nodes)

@api.route('/hits/<hid>/edit', methods=['POST'])
@admin_required
def hit_edit(hid):
    """ Edits the hit configuration using the received config.
    """
    hit = app.session.query(HITSpec).get(int(hid))
    if hit is None:
        return jsonify({'msg': 'invalid hit'}), 400

    hit.update(request.json)
    app.session.commit()
    return jsonify_or_404(hit, with_instances=False, with_config=True)

# INSTANCES

# return one HIT instance
@api.route('/instances/<iid>')
def instance(iid):
    with_nodes = request.args.get('with_nodes', True)
    with_response_info = request.args.get('with_response_info', True)
    res = app.session.query(HITInstance).get(bytes.fromhex(iid))
    return jsonify_or_404(res, with_nodes=with_nodes)


# @api.route('/instance-previews/<iid>')
# def instance_preview(iid):
#     res = HITInstance.query.filter_by(preview_id=bytes.fromhex(iid)).first()
#     return jsonify_or_404(res, with_tasks=True, with_response_info=False)


@api.route('/hits/<hid>/instances/add')
def instance_add(hid):
    """Adds an instance (link) to the HIT

    Args:
        hid (str): HIT ID

    Returns:
        json: the added instance object
    """
    num_instances = request.args.get('num_instances', 1)
    hit = app.session.query(HITSpec).get(bytes.fromhex(hid))
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
    hit = app.session.query(HITSpec).get(bytes.fromhex(hid))
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
