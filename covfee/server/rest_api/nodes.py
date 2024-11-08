from flask import current_app as app
from flask import jsonify, request

from covfee.server.orm.node import NodeInstance, NodeInstanceManualStatus
from covfee.server.socketio.socket import socketio

from ..orm import NodeInstanceStatus, TaskInstance
from .api import api
from .auth import admin_required
from .utils import jsonify_or_404

# TASKS


@api.route("/nodes/<nid>")
def nodes(nid):
    node = app.session.query(NodeInstance).get(int(nid))
    return jsonify_or_404(node)


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
    
    # check that the node is <= max_submitted_node_index + 1 for all journeys
    journeys = task.journeys
    if not all(journey.nodes.index(task) <= journey.max_submitted_node_index + 1 for journey in journeys):
        return jsonify({"msg": "Task cannot be submitted because some of its journeys contain incoming unsubmitted nodes."}), 400

    task.responses[-1].submit(request.json)
    app.session.commit()

    payload = task.make_status_payload()
    socketio.emit("status", payload, to=task.id)
    socketio.emit("status", payload, namespace="/admin")

    return "", 200


# state management
@api.route("/nodes/<nid>/manual/<status>")
@admin_required
def set_manual_status(nid, status):
    node = app.session.query(NodeInstance).get(int(nid))

    node.set_manual(NodeInstanceManualStatus(int(status)))
    app.session.commit()

    # notify users and admins
    payload = node.make_status_payload()
    socketio.emit("status", payload, to=node.id)
    socketio.emit("status", payload, namespace="/admin")
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
        socketio.emit("status", payload, namespace="/admin")

    app.session.commit()
    return "", 200
