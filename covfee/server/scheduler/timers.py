from __future__ import annotations
from typing import TYPE_CHECKING, Literal
from datetime import datetime, timedelta

from covfee.server.socketio.socket import socketio
from .apscheduler import scheduler

if TYPE_CHECKING:
    from covfee.server.orm.node import NodeInstance

TimerName = Literal["pause", "finish", "empty", "count"]


def update_status_job(timer: TimerName, node_id):
    from covfee.server.orm.node import NodeInstance

    with NodeInstance.sessionmaker() as session:
        node = session.query(NodeInstance).get(node_id)
        if node is None:
            return print(f"update_status_job could not find node with id {node_id}")

        node.check_timer(timer)
        session.commit()
        payload = node.make_status_payload()

    socketio.emit("status", payload, to=node.id)
    socketio.emit("status", payload, namespace="/admin")


def schedule_timer(node: NodeInstance, timer: TimerName):
    """
    Schedule a timer for this task. Two types of timers:
    - finish timer: two modes:
        if timer_pausable == True:
            - while the task is running, the timer runs since the last play, for timer - elapsed seconds
        if timer_pausable == False:
            - while the task is not finished, runs since task start, for timer seconds
    - pause timer: runs since the last pause, while the task is paused
    """
    if timer == "pause":
        timer_time = node.spec.settings.get("timer_pause", None)
        if timer_time is None:
            return

        scheduler.add_job(
            update_status_job,
            "date",
            run_date=datetime.now() + timedelta(seconds=timer_time),
            kwargs={
                "timer": timer,
                # "sessionmaker": app.sessionmaker,
                "node_id": node.id,
            },
            id=f"{node.id}_pause",
        )

    elif timer == "finish":
        timer_time = node.spec.settings.get("timer", None)

        if timer_time is None:
            return

        scheduler.add_job(
            update_status_job,
            "date",
            run_date=datetime.now() + timedelta(seconds=timer_time - node.t_elapsed),
            kwargs={
                "timer": timer,
                # "sessionmaker": app.sessionmaker,
                "node_id": node.id,
            },
            id=f"{node.id}_finish",
        )
        # app.logger.info(f"Scheduled job finish: node={node.id}, ")

    elif timer == "count":
        timer_time = node.spec.settings.get("countdown", 0)

        if timer_time == 0:
            raise ValueError("schedule_timer called for countdown but coundown is zero")

        scheduler.add_job(
            update_status_job,
            "date",
            run_date=datetime.now() + timedelta(seconds=timer_time),
            kwargs={
                "timer": timer,
                # "sessionmaker": app.sessionmaker,
                "node_id": node.id,
            },
            id=f"{node.id}_count",
        )
        print(f"Scheduled job finish: node={node.id}, ")

    else:
        raise NotImplementedError()


def stop_timer(node: NodeInstance, timer=TimerName):
    job_id = f"{node.id}_{timer}"
    job = scheduler.get_job(job_id)

    if job is not None:
        scheduler.remove_job(job_id)
        print(f"Job {job_id} cancelled")
