import hashlib
import hmac
from typing import Dict

from covfee.server.orm.chat import Chat, ChatMessage

from .. import tasks
from ..tasks.base import BaseCovfeeTask, CriticalError
from flask import current_app as app, session
from flask_socketio import SocketIO, send, emit, join_room, leave_room, Namespace
from covfee.server.orm import (
    NodeInstance,
    TaskResponse,
    JourneyInstance,
    NodeInstanceStatus,
)
from covfee.server.socketio.redux_store import ReduxStoreClient

socketio = SocketIO()
store = ReduxStoreClient()


def get_journey(jid: str) -> JourneyInstance:
    return app.session.query(JourneyInstance).get(bytes.fromhex(jid))


def get_node(nodeId: int) -> NodeInstance:
    return app.session.query(NodeInstance).get(nodeId)


def get_response(responseId: int) -> TaskResponse:
    return app.session.query(TaskResponse).get(responseId)


def get_chat(chatId: int) -> Chat:
    return app.session.query(Chat).get(chatId)


def get_task_object(responseId: int):
    response = app.session.query(TaskResponse).get(responseId)
    if response is None:
        return None

    task = response.task
    task_class = getattr(tasks, task.spec.spec["type"], BaseCovfeeTask)
    task_object = task_class(response=response)
    return task_object


@socketio.on("connect")
def on_connect(data):
    app.logger.info(f"socketio: connect {str(data)}")

    journey = get_journey(data["journeyId"])
    if journey is None:
        return False
    journey.num_connections += 1
    app.session.commit()

    session["journeyId"] = data["journeyId"]
    payload = {
        "hit_id": journey.hit_id.hex(),
        "journey_id": data["journeyId"],
        "num_connections": journey.num_connections,
    }
    emit("journey_connect", payload, namespace="/admin", broadcast=True)


def make_node_status_payload(prev_status: NodeInstanceStatus, node: NodeInstance):
    return {
        "id": node.id,
        "hit_id": node.hit_id.hex(),
        "prev": prev_status,
        "new": node.status,
        "curr_journeys": [j.id.hex() for j in node.curr_journeys],
    }


@socketio.on("join")
def on_join(data):
    app.logger.info(f"socketio: join {str(data)}")
    curr_journey_id = str(data["journeyId"])
    curr_journey = get_journey(curr_journey_id)

    curr_node_id = int(data["nodeId"])
    curr_node = get_node(curr_node_id)

    curr_response_id = int(data["responseId"])
    response = get_response(curr_response_id)

    use_shared_state = data["useSharedState"]

    if curr_journey is None or curr_node is None:
        return send(
            f"Unable to join, journeyId={curr_journey_id}, nodeId={curr_node_id}"
        )

    if curr_node not in curr_journey.nodes:
        return send(
            f"Unable to join nodeId={curr_node_id} is not in journey journeyId={curr_journey_id}"
        )

    if "responseId" in session:
        # user comes from another node
        prev_response_id = str(session["responseId"])
        leave_room(prev_response_id)
        session["responseId"] = None  # just in case

        prev_node_id = str(session["nodeId"])
        prev_node = get_node(prev_node_id)
        prev_node_prev_status = prev_node.status

        if "useSharedState" in session and session["useSharedState"]:
            leave_store(prev_response_id)
    else:
        prev_response_id = None
        prev_node = None
        prev_node_prev_status = None

    join_room(curr_response_id)
    curr_node_prev_status = curr_node.status

    # update the journey and node status
    curr_journey.set_curr_node(curr_node)
    task_object = get_task_object(int(curr_response_id))

    try:
        join_payload = {"task_data": task_object.on_join(curr_journey)}
    except CriticalError as ex:
        join_payload = {
            "error": ex.msg,
            "load_task": ex.load_task,
        }
    except Exception as ex:
        join_payload = {
            "error": f"Unknown exception while executing on_join for task {task_object.__class__.__name__}",
            "load_task": True,
        }
        app.logger.error(
            f"Error running on_join for task {task_object.__class__.__name__}"
        )

    emit("join", join_payload)
    app.logger.info(f"socketio: join: {str(join_payload)}")
    app.session.commit()

    # update previous node status
    if prev_node is not None:
        payload = make_node_status_payload(prev_node_prev_status, prev_node)
        emit("status", payload, to=prev_response_id)
        emit("status", payload, namespace="/admin", broadcast=True)

    # update current node status
    payload = make_node_status_payload(curr_node_prev_status, curr_node)
    emit("status", payload, to=curr_response_id)
    emit("status", payload, namespace="/admin", broadcast=True)

    session["journeyId"] = curr_journey_id
    session["nodeId"] = curr_node_id
    session["responseId"] = curr_response_id
    session["useSharedState"] = use_shared_state

    if use_shared_state:
        res = store.join(
            curr_response_id, response.task.spec.spec["type"], response.state
        )
        if res["success"]:
            emit("state", res)
        else:
            app.logger.error(f"Redux store returned error")


# admin joins a node
@socketio.on("join", namespace="/admin")
def on_admin_join(data):
    curr_node_id = int(data["nodeId"])
    curr_response_id = int(data["responseId"])
    response = get_response(curr_response_id)

    use_shared_state = data["useSharedState"]

    join_room(curr_response_id, namespace="/admin")

    session["nodeId"] = curr_node_id
    session["responseId"] = curr_response_id
    session["useSharedState"] = use_shared_state

    if use_shared_state:
        # task may not be running so we need to pass the state
        res = store.join(
            curr_response_id, response.task.spec.spec["type"], response.state
        )
        if res["success"]:
            emit("state", res, namespace="/admin", broadcast=True)

            # if this is the first join, run the on_first_join callback
            # if res['numConnections'] == 1:
            #     get_task_object(int(room)).on_first_join()

        else:
            send(f"Unable to join room id={curr_response_id}")


@socketio.on("action")
def on_action(data):
    action = data["action"]
    responseId = str(data["responseId"])
    # if responseId != session["responseId"]:
    #     return send(
    #         f'data["responseId"] does not match session\'s responseId variable. {responseId} != {session["responseId"]}'
    #     )

    res = store.action(responseId, action)
    if res["success"]:
        emit("action", action, to=responseId)
        emit("action", action, to=responseId, namespace="/admin")


def leave_store(responseId):
    logger.info(f"Leaving response {responseId}")
    res = store.leave(responseId)
    if res["success"]:
        # save state to database
        response = get_response(responseId)
        response.state = res["state"]
        app.session.commit()


@socketio.on("disconnect")
def disconnect():
    if "journeyId" not in session:
        return
    journey_id = session["journeyId"]
    journey = get_journey(journey_id)
    journey.num_connections = max(0, journey.num_connections - 1)
    node = journey.curr_node
    prev_status = node.status if node else None
    # journey.set_curr_node(None)
    app.session.commit()

    # broadcast to admins
    payload = {
        "hit_id": journey.hit_id.hex(),
        "journey_id": journey_id,
        "num_connections": journey.num_connections,
    }
    emit("journey_connect", payload, namespace="/admin", broadcast=True)

    # now update node
    if "responseId" not in session:
        return
    response_id = int(session["responseId"])

    if "useSharedState" in session and session["useSharedState"]:
        leave_store(response_id)

    if node:
        payload = make_node_status_payload(prev_status, node)
        emit("status", payload, to=response_id)
        emit("status", payload, namespace="/admin", broadcast=True)


### CHAT ###


def on_chat(data: Dict):
    if "chatId" not in data:
        return send(f"chatId not sent")

    chatId = int(data["chatId"])
    message = ChatMessage(data["message"])
    chat = get_chat(chatId)
    if chat is None:
        return send(f"chat not found")
    chat.messages.append(message)
    app.session.commit()

    # emit the message
    emit("message", message.to_dict(), to=chatId, namespace="/chat")

    # broadcast to admins
    emit("message", message.to_dict(), namespace="/admin_chat", broadcast=True)


socketio.on_event("message", on_chat, namespace="/chat")
socketio.on_event("message", on_chat, namespace="/admin_chat")
socketio.on_event("message", on_chat, namespace="/admin")


@socketio.on("join_chat", namespace="/chat")
def on_join_chat(data):
    chatId = data["chatId"]
    chat = get_chat(chatId)

    if chat is None:
        return send(f"Unable to join, chatId={chatId}")

    join_room(chat.id, namespace="/chat")
    session["chatId"] = chatId
