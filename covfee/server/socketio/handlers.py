import datetime
from typing import Union

from flask import current_app as app
from flask import session
from flask_socketio import emit, join_room, leave_room, send

from covfee.server.orm import JourneyInstance, NodeInstance
from covfee.server.orm.chat import Chat
from covfee.server.orm.journey import JourneyInstanceStatus
from covfee.server.orm.task import TaskInstance
from covfee.server.socketio.socket import socketio, store

from ..tasks.base import CriticalError


def get_journey(jid: str) -> JourneyInstance:
    return app.session.query(JourneyInstance).get(bytes.fromhex(jid))


def get_node(nodeId: int) -> Union[NodeInstance, TaskInstance]:
    return app.session.query(NodeInstance).get(nodeId)


def get_chat(chatId: int) -> Chat:
    return app.session.query(Chat).get(chatId)


def get_on_join_payload(node: TaskInstance, journey: JourneyInstance):
    response = node.responses[-1].to_dict()
    task_object = node.get_task_object()
    if task_object is not None:
        try:
            payload = {"task_data": task_object.on_join(journey)}
        except CriticalError as ex:
            payload = {
                "error": ex.msg,
                "load_task": ex.load_task,
            }
        except Exception:
            payload = {
                "error": f"Unknown exception while executing on_join for task {task_object.__class__.__name__}",
                "load_task": True,
            }
            app.logger.error(
                f"Error running on_join for task {task_object.__class__.__name__}"
            )
    else:
        payload = {}

    payload = {"node_id": node.id, "response": response, **payload}

    return payload


@socketio.on("connect")
def on_connect(data):
    app.logger.info(f"socketio: connect {str(data)}")

    journey = get_journey(data["journeyId"])
    if journey is None:
        return False
    journey.num_connections += 1
    if journey.dt_first_join is None:
        journey.set_status(JourneyInstanceStatus.RUNNING)
        journey.dt_first_join = datetime.datetime.now()
    app.session.commit()

    session["journeyId"] = data["journeyId"]
    emit("journey_status", journey.make_status_payload(), namespace="/admin", broadcast=True)
    join_room(journey.id.hex())


@socketio.on("join")
def on_join(data):
    app.logger.info(f"socketio: join {str(data)}")
    curr_journey_id = str(data["journeyId"])
    curr_journey = get_journey(curr_journey_id)

    curr_node_id = int(data["nodeId"])
    curr_node = get_node(curr_node_id)
    use_shared_state = data["useSharedState"]

    if curr_journey is None or curr_node is None:
        return send(
            f"Unable to join, journeyId={curr_journey_id}, nodeId={curr_node_id}"
        )

    if curr_node not in curr_journey.nodes:
        return send(
            f"Unable to join nodeId={curr_node_id} is not in journey journeyId={curr_journey_id}"
        )

    if "nodeId" in session:
        # user comes from another node
        prev_node_id = str(session["nodeId"])
        leave_room(prev_node_id)
        session["nodeId"] = None  # just in case

        prev_node = get_node(prev_node_id)
        prev_node_prev_status = prev_node.status

        if "useSharedState" in session and session["useSharedState"]:
            leave_store(prev_node_id)

        # update previous node status
        payload = prev_node.make_status_payload(prev_node_prev_status)
        app.logger.info(f"emit: status {str(payload)}")
        emit("status", payload, to=prev_node_id)
        emit("status", payload, namespace="/admin", broadcast=True)

    join_room(curr_node_id)
    curr_node_prev_status = curr_node.status

    # update the journey and node status
    curr_journey.set_curr_node(curr_node)
    join_payload = get_on_join_payload(curr_node, curr_journey)
    curr_node.check_n()

    emit("join", join_payload)
    app.logger.info(f"socketio: join: {str(join_payload)}")

    app.session.commit()

    # update current node status
    payload = curr_node.make_status_payload(curr_node_prev_status)
    emit("status", payload, to=curr_node_id)
    emit("status", payload, namespace="/admin", broadcast=True)
    app.logger.info(f"emit: status {str(payload)}")

    session["journeyId"] = curr_journey_id
    session["nodeId"] = curr_node_id
    session["useSharedState"] = use_shared_state

    if isinstance(curr_node, TaskInstance) and use_shared_state:
        response = curr_node.responses[-1]
        res = store.join(curr_node_id, curr_node.spec.spec["type"], response.state)
        if res["success"]:
            emit("state", res, to=curr_node_id)
        else:
            app.logger.error("Redux store returned error")


# admin joins a node
# to support observer mode
@socketio.on("join", namespace="/admin")
def on_admin_join(data):
    app.logger.info(f"socketio(admin): join {str(data)}")
    curr_node_id = int(data["nodeId"])
    curr_node = get_node(curr_node_id)

    use_shared_state = data["useSharedState"]

    join_room(curr_node_id, namespace="/admin")

    session["nodeId"] = curr_node_id
    session["useSharedState"] = use_shared_state

    join_payload = get_on_join_payload(curr_node, None)

    emit("join", join_payload)
    app.logger.info(f"socketio(admin): join: {str(join_payload)}")

    if isinstance(curr_node, TaskInstance) and use_shared_state:
        # task may not be running so we need to pass the state
        response = curr_node.responses[-1]
        res = store.join(curr_node_id, curr_node.spec.spec["type"], response.state)
        if res["success"]:
            emit("state", res, namespace="/admin", broadcast=True)

            # if this is the first join, run the on_first_join callback
            # if res['numConnections'] == 1:
            #     get_task_object(int(room)).on_first_join()

        else:
            send(f"Unable to join store node_id={curr_node_id}")


@socketio.on("state")
def on_state(data):
    """state is sent directly from the client
    used when useSharedState==False for autosave feature
    """
    app.logger.info(f"socketio: state {str(data)}")
    nodeId = int(data["nodeId"])
    state = data["state"]

    response = get_node(nodeId).responses[-1]
    response.state = state
    app.session.commit()


@socketio.on("action")
def on_action(data):
    action = data["action"]
    nodeId = int(data["nodeId"])

    res = store.action(nodeId, action)
    if res["success"]:
        emit("action", action, to=nodeId)
        emit("action", action, to=nodeId, namespace="/admin")


def leave_store(nodeId):
    app.logger.info(f"Leaving node {nodeId}")
    res = store.leave(nodeId)
    if res["success"]:
        # save state to database
        response = get_node(nodeId).responses[-1]
        response.state = res["state"]
        app.session.commit()


@socketio.on("disconnect")
def disconnect():
    if "journeyId" not in session:
        return

    # important: same journey can have multiple connections (tabs)
    journey_id = session["journeyId"]
    journey = get_journey(journey_id)
    journey.num_connections = max(0, journey.num_connections - 1)
    node = journey.curr_node

    if node is not None:
        prev_status = node.status if node else None
        node.check_n()
    journey.set_curr_node(None)
    app.session.commit()

    # broadcast to admins
    payload = {
        "hit_id": journey.hit_id.hex(),
        "journey_id": journey_id,
        "num_connections": journey.num_connections,
    }
    emit("journey_status", payload, namespace="/admin", broadcast=True)

    # now update node
    if not isinstance(node, TaskInstance):
        return

    if "useSharedState" in session and session["useSharedState"]:
        leave_store(node.responses[-1].id)

    if node:
        payload = node.make_status_payload(prev_status)
        emit("status", payload, to=node.id)
        emit("status", payload, namespace="/admin", broadcast=True)
        app.logger.info(f"emit: status {str(payload)}")
