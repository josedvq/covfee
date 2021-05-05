import pandas as pd
import numpy as np
from typing import Tuple, List, Any


class BaseCovfeeTask:

    def __init__(self, response):
        self.response = response

    def to_dict(self, response: object, data: np.ndarray = None) -> dict:
        """Processes a task response to return a friendly dict (JSON) with task results and metadata
        Called when data is downloaded in JSON format.
        Does not affect the data in the database.

        Args:
            response (object): The task response. The format is task-specific.
            data (np.ndarray, optional): The continuous data. Defaults to None.

        Returns:
            dict: task response and summary metadata
        """
        # TODO: add more metadata to the aggregated content
        return {
            'response': response,
            'data': data.tolist() if data is not None else []
        }

    def to_dataframe(self, data: np.ndarray) -> pd.DataFrame:
        """Transforms the submitted data into a pandas dataframe.
        This method is called when results are downloaded as CSV from the admin panel.
        It can be implemented to add headers to the default dataframe or to filter data before download.
        Does not affect the data in the database.

        Args:
            data (bytes): Binary, aggregated data.
        """
        if data is None:
            return None
        else:
            return pd.DataFrame(data)

    def validate(self, response: Any, data: np.ndarray = None, log_data: List[List[Any]] = None):
        """This method decides whether a particular task submission will be accepted or not

        Args:
            response (object): The (non-continuous) task response. Usually includes the value of 
                input forms / sliders / radio buttons in the task.
            data (pd.DataFrame): The continuous task response, includes all the data points 
                logged by the task. For continuous tasks this may be the only response.
            log_data (list[list[any]], optional): The logs submitted by the task via buffer.log(). 
                Usually contains auxiliary information. Defaults to None.

        Returns:
            [type]: [description]
        """
        return True
