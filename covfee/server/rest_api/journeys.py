import zipstream
from flask import Response
from flask import current_app as app
from flask import jsonify, redirect, request, stream_with_context

from covfee.server.orm.journey import JourneyInstanceStatus
from covfee.server.socketio.socket import socketio

from ..orm import JourneyInstance
from .api import api
from .auth import admin_required
from .utils import jsonify_or_404

# Journeys


@api.route("/journeys/<jid>")
def journey(jid):
    with_nodes = request.args.get("with_nodes", True)
    with_response_info = request.args.get("with_response_info", True)
    res = app.session.query(JourneyInstance).get(bytes.fromhex(jid))
    return jsonify_or_404(
        res, with_nodes=with_nodes, with_response_info=with_response_info
    )

@api.route("/journeys/<jid>/submit")
def journey_submit(jid):
    journey = app.session.query(JourneyInstance).get(bytes.fromhex(jid))
    journey.submit()

    app.session.commit()
    payload = journey.make_status_payload()
    socketio.emit("journey_status", payload, to=journey.id.hex())
    socketio.emit("journey_status", payload, namespace="/admin")

    return jsonify_or_404(journey, with_nodes=False, with_response_info=True)


@api.route("/journeys/<jid>/disable")
@admin_required
def journey_disable(jid):
    journey = app.session.query(JourneyInstance).get(bytes.fromhex(jid))

    journey.set_status(JourneyInstanceStatus.DISABLED)
    app.session.commit()

    payload = journey.make_status_payload()
    socketio.emit("journey_status", payload, to=journey.id.hex())
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
