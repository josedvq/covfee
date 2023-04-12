from io import BytesIO

from flask import request, jsonify, \
     send_file, current_app as app
import zipstream

from .api import api
from .auth import admin_required
from .utils import jsonify_or_404
from ..orm import TaskSpec, TaskInstance, TaskResponse

# TASKS

# delete an existing task
@api.route('/tasks/<kid>/delete')
def task_delete(kid):
    task = app.session.query(TaskInstance).get(int(kid))
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
    task = app.session.query(TaskInstance).get(int(kid))
    if task is None:
        return jsonify({'msg': 'invalid task'}), 400

    responses = task.responses
    submitted = request.args.get('submitted', None)
    if submitted is not None:
        responses = [r for r in responses if r.submitted == bool(submitted)]

    if len(responses) == 0:
        return jsonify(msg='No submitted responses found.'), 403

    response_dict = responses[-1].to_dict()
    return jsonify(response_dict)

@api.route('/tasks/<kid>/make_response', methods=['POST'])
def make_response(kid):
    submit = bool(request.args.get('submit', False))

    task = app.session.query(TaskInstance).get(int(kid))
    if task is None:
        return jsonify({'msg': 'invalid task'}), 400

    response = task.add_response()
    if request.json:
        response.update(request.json)
    if submit:
        response.submit()
    app.session.commit()
    return jsonify(response.to_dict())

# record a response to a task
@api.route('/responses/<rid>/submit', methods=['POST'])
def response_submit(rid):
    response = app.session.query(TaskResponse).get(int(rid))
    if response is None:
        return jsonify({'msg': 'invalid response'}), 400

    res = response.submit(request.json)    
    app.session.commit()
    return jsonify(res)

@api.route('/responses/<rid>/chunks', methods=['GET'])
def query_chunks(rid):
    response = app.session.query(TaskResponse).get(int(rid))
    if response is None:
        return jsonify({'msg': 'invalid response'}), 400

    chunk_bytes = response.pack_chunks()
    return send_file(BytesIO(chunk_bytes), mimetype='application/octet-stream'), 200
