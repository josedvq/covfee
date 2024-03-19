from __future__ import annotations

from typing import TYPE_CHECKING

from flask import Blueprint

from ...logger import logger
from ..orm.journey import JourneyInstance

if TYPE_CHECKING:
    from covfee.server.orm.response import TaskResponse
    from covfee.server.orm.task import TaskInstance


class CriticalError(Exception):
    """When raised from a custom task callback will cause a critical error message to be shown to the user."""

    def __ini__(self, load_task=False):
        """_summary_

        Args:
            load_task (bool, optional): Whether to continue loading the task in frontend. Defaults to False.
        """
        super().__init__("Critical error encountered in custom task callback.")
        self.load_task = load_task


class BaseCovfeeTask:
    def __init__(self, task: TaskInstance = None, session=None):
        self.task = task
        self.session = session

    @classmethod
    def get_blueprint(cls) -> Blueprint | None:
        return None

    def get_task_specific_props(self) -> dict:
        """Used to extend the dict that is send to the browser as props for the task element.

        Returns:
            dict: new props to be merged with the default props
        """
        return {}

    def validate(
        self,
        response: TaskResponse,
    ) -> (bool, str):
        """This method decides whether a particular task submission will be accepted or not

        Args:
            response (object): The task response object.

        Returns:
            [type]: [description]
        """
        return True, None

    def on_start(self):
        """Called when the task status changes from INIT to RUNNING, ie when the task is started for the first time"""
        logger.info("BaseCovfeeTask: on_start")

    def on_run(self):
        """Called when the task status changes to RUNNING (after the countdown), including the first time. ie. when the task starts the first time both on_start and on_run are called."""
        logger.info("BaseCovfeeTask: on_run")

    def on_pause(self):
        """Called when the task status changes to PAUSE."""
        logger.info("BaseCovfeeTask: on_pause")

    def on_finish(self):
        """Called when the task status changes to FINISH."""
        logger.info("BaseCovfeeTask: on_finish")

    def on_admin_pause(self):
        """Called when the task is paused by an admin"""
        logger.info("BaseCovfeeTask: on_admin_pause")

    def on_create(self):
        """Called when the task is created
        (for socketio-enabled tasks)
        """
        logger.info("BaseCovfeeTask: on_create")

    def on_join(self, journey: JourneyInstance = None):
        """Called when any visitor joins the task.
        May be called multiple times per journey.
        (for socketio-enabled tasks)
        """
        logger.info("BaseCovfeeTask: on_join")

    def on_leave(self):
        """Called when a subject the task page
        (for socketio-enabled tasks)
        """
        logger.info("BaseCovfeeTask: on_leave")
