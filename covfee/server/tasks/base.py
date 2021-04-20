import pandas as pd
import numpy as np
from typing import Tuple, List, Any


class BaseCovfeeTask:

    def __init__(self, response):
        self.response = response

    def aggregate_data_chunks(self, chunks: List[Tuple[bytes, int]]) -> np.ndarray:
        """This method takes care of aggregating a list of binary data chunks into a single numpy array.
        Normally this method would not be implemented in subclasses.
        Does not affect the data in the database.

        Args:
            data_chunks (list[bytes]): list of chunks as sent from the server. Size of the chunks may vary.

        Returns:
            np.ndarray: single numpy array with the aggregated data
        """
        if not chunks:
            return None

        idxs_chunks = list()
        data_chunks = list()

        for chunk, chunk_length in chunks:
            if len(chunk) % chunk_length != 0:
                raise Exception('Chunk byte length is not.')
            bytes_per_record = len(chunk) // chunk_length

            if (bytes_per_record - 4) % 8 != 0:
                raise Exception('Number of data bytes per record is not an 8-multiple.')
            datapoints_per_record = (bytes_per_record - 4) // 8
            idxs_chunks.append(np.frombuffer(
                chunk,
                dtype=np.uint32,
                count=chunk_length,
                offset=0).astype(np.float64).reshape(-1, 1))
            data_chunks.append(np.frombuffer(
                chunk,
                dtype=np.float64,
                count=chunk_length * datapoints_per_record,
                offset=4 * chunk_length).reshape(-1, datapoints_per_record))

        idxs = np.vstack(idxs_chunks)
        data = np.vstack(data_chunks)
        assert len(idxs) == len(data)

        return np.hstack([idxs, data])

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

    def validate(self, response: object, data: np.ndarray = None, log_data: List[List[Any]] = None):
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
