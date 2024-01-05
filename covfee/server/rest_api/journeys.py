from flask import (
    request,
    jsonify,
    redirect,
    Response,
    stream_with_context,
    current_app as app,
)
import zipstream

from .api import api
from .auth import admin_required
from .utils import jsonify_or_404
from ..orm import JourneyInstance
from covfee.server.socketio.socket import socketio

# Journeys


# return one HIT instance
@api.route("/journeys/<jid>")
def journey(jid):
    with_nodes = request.args.get("with_nodes", True)
    with_response_info = request.args.get("with_response_info", True)
    res = app.session.query(JourneyInstance).get(bytes.fromhex(jid))
    return jsonify_or_404(
        res, with_nodes=with_nodes, with_response_info=with_response_info
    )


# return one HIT instance
@api.route("/journeys/<jid>/pause/<pause>")
@admin_required
def journey_pause(jid, pause):
    pause = bool(int(pause))
    journey = app.session.query(JourneyInstance).get(bytes.fromhex(jid))

    for node in journey.nodes:
        node.paused = pause

        # notify users and admins
        payload = node.make_status_payload(node)
        socketio.emit("status", payload, to=node.id)
        socketio.emit("status", payload, namespace="/admin")
    app.session.commit()
    return "", 200


@api.route("/journeys/<jid>/disable/<disable>")
@admin_required
def journey_disable(jid, disable):
    disable = bool(int(disable))
    journey = app.session.query(JourneyInstance).get(bytes.fromhex(jid))

    journey.disabled = disable
    app.session.commit()

    payload = journey.make_status_payload()
    socketio.emit("journey_status", payload, to=journey.id)
    socketio.emit("journey_status", payload, namespace="/admin")

    return "", 200


@api.route("/journeys/<jid>/nodes/<nidx>/ready/<value>")
@admin_required
def node_ready(jid, nidx, value):
    journey = app.session.query(JourneyInstance).get(bytes.fromhex(jid))

    node_index = int(nidx)
    ready = value == "1"
    journey.node_associations[node_index].ready = ready
    node = journey.node_associations[node_index].node

    prev_status = node.status
    node.check_n()
    app.session.commit()

    payload = node.make_status_payload(prev_status)
    socketio.emit("status", payload, to=node.id)
    socketio.emit("status", payload, namespace="/admin")

    return "", 200
