from __future__ import annotations
import pandas as pd
import numpy as np
from typing import Tuple, List, Any, TYPE_CHECKING

from ..orm.journey import JourneyInstance
from ...logger import logger

if TYPE_CHECKING:
    from covfee.server.orm.task import TaskInstance
    from covfee.server.orm.response import TaskResponse


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
    def __init__(self, task: TaskInstance = None):
        self.task = task

    def get_task_specific_props(self) -> dict:
        """Used to extend the dict that is send to the browser as props for the task element.

        Returns:
            dict: new props to be merged with the default props
        """
        return {}

    def to_dict(self, with_chunk_data: bool) -> dict:
        """Processes a task response to return a friendly dict (JSON) with task results and metadata
        Called when data is downloaded in JSON format.
        Does not affect the data in the database.

        Args:
            with_chunk_data (bool): If true, include the continuous response data.

        Returns:
            dict: task response and summary metadata
        """
        if with_chunk_data:
            chunk_data, chunk_logs = self.response.get_ndarray()
        else:
            chunk_data, chunk_logs = (None, None)

        return {
            "response": self.response.data,
            "data": chunk_data.tolist() if chunk_data is not None else [],
            "logs": chunk_logs if chunk_logs is not None else [],
            "created_at": self.response.created_at.isoformat(),
            "updated_at": self.response.updated_at.isoformat(),
            "submitted_at": self.response.submitted_at.isoformat(),
        }

    def to_dataframe(self, data: np.ndarray) -> pd.DataFrame:
        """Transforms the submitted data into a pandas dataframe.
        This method is called when results are downloaded as CSV from the admin panel.
        It can be implemented to add headers to the default dataframe or to filter data before download.
        Does not affect the data in the database.

        Args:
            data (np.ndarray): Continuous data aggregated into a single array
                with shape (num_samples, sample_size)
                - num_samples depends on the video duration and the specified
                sampling rate
                - sample_size is the size of each annotated record (eg. 1 for Continuous1D,
                2 for ContinuousKeypoint)
        """
        if data is None:
            return None
        else:
            assert data.ndim == 2
            assert data.shape[1] >= 3
            num_columns = data.shape[1] - 2
            return pd.DataFrame(
                data,
                columns=[
                    "index",
                    "media_time",
                    *[f"data{i}" for i in range(num_columns)],
                ],
            )

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

    def on_status_change(self):
        """Called when the task changes status"""
        logger.info("BaseCovfeeTask: on_status_change")

    def on_admin_pause(self):
        """Called when the task is paused by an admin"""
        logger.info("BaseCovfeeTask: on_admin_pause")

    def on_create(self):
        """Called when the task is created
        (for socketio-enabled tasks)
        """
        logger.info("BaseCovfeeTask: on_create")

    def on_join(self, journey: JourneyInstance):
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
