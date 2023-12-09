from io import BytesIO

from flask import request, jsonify, send_file, current_app as app
import zipstream

from covfee.server.orm.node import NodeInstance
from flask_socketio import send, emit, join_room, leave_room

from .api import api
from .auth import admin_required
from .utils import jsonify_or_404
from ..orm import TaskSpec, TaskInstance, TaskResponse, NodeInstanceStatus
from ..socketio import socketio

# TASKS


@api.route("/nodes/<nid>")
def nodes(nid):
    node = app.session.query(NodeInstance).get(int(nid))
    return jsonify_or_404(node)


@api.route("/nodes/<nid>/response")
def response(nid):
    """Will return the last response for a task"""
    task = app.session.query(NodeInstance).get(int(nid))
    if task is None or not isinstance(task, TaskInstance):
        return jsonify({"msg": "invalid task"}), 400

    responses = task.responses
    submitted = request.args.get("submitted", None)
    if submitted is not None:
        responses = [r for r in responses if r.submitted == bool(submitted)]

    if len(responses) == 0:
        return jsonify(msg="No submitted responses found."), 403

    response_dict = responses[-1].to_dict()
    return jsonify(response_dict)


@api.route("/nodes/<nid>/make_response", methods=["POST"])
def make_response(nid):
    submit = bool(request.args.get("submit", False))

    task = app.session.query(TaskInstance).get(int(nid))
    if task is None or not isinstance(task, TaskInstance):
        return jsonify({"msg": "invalid task"}), 400

    response = task.add_response()
    if request.json:
        response.update(request.json)
    if submit:
        response.submit()
    app.session.commit()
    return jsonify(response.to_dict())


# record a response to a task
@api.route("/nodes/<nid>/submit", methods=["POST"])
def response_submit(nid):
    task = app.session.query(NodeInstance).get(int(nid))

    if task is None or not isinstance(task, TaskInstance):
        return jsonify({"msg": "invalid task"}), 400

    res = task.responses[-1].submit(request.json)
    app.session.commit()
    return jsonify(res)


# state management
@api.route("/nodes/<nid>/pause/<pause>")
@admin_required
def pause_node(nid, pause):
    pause = bool(int(pause))
    node = app.session.query(NodeInstance).get(int(nid))
    node.paused = pause

    app.session.commit()

    # notify users and admins
    payload = node.make_status_payload()
    print(payload)
    print(node.id)
    socketio.emit("status", payload, to=node.id)
    socketio.emit("status", payload, namespace="/admin", broadcast=True)
    return "", 200


@api.route("/nodes/<nid>/restart")
@admin_required
def restart_node(nid):
    node = app.session.query(NodeInstance).get(int(nid))
    node.status = NodeInstanceStatus.INIT

    if isinstance(node, TaskInstance):
        # restart the task by adding a new response
        node.add_response()
        payload = node.make_status_payload()
        socketio.emit("status", payload, to=node.id)
        socketio.emit("status", payload, namespace="/admin", broadcast=True)

    app.session.commit()
    return "", 200
