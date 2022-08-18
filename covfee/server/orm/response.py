import datetime
from typing import Tuple

import numpy as np
from sqlalchemy import (
    Integer,
    JSON,
    Boolean,
    Column, 
    DateTime, 
    ForeignKey)
from sqlalchemy.orm import relationship

from db import Base
from ..tasks.base import BaseCovfeeTask

class Response(Base):
    """ Represents a task's response """
    __tablename__ = 'taskresponses'

    id = Column(Integer, primary_key=True)
    task_id = Column(Integer, ForeignKey('tasks.id'))
    # backref task

    chunks = relationship("Chunk", backref='taskresponse',
                             order_by="Chunk.index", cascade="all, delete-orphan", lazy="dynamic")

    state = Column(JSON) # holds the shared state of the task

    submitted = Column(Boolean)
    valid = Column(Boolean)
    data = Column(JSON)

    created_at = Column(DateTime, default=datetime.datetime.now)
    updated_at = Column(DateTime, onupdate=datetime.datetime.now)
    submitted_at = Column(DateTime)

    # can be used to store server state (eg. state of recording)
    extra = Column(JSON)

    def __init__(self):
        self.submitted = False
        self.valid = False
        self.extra = {}

    def as_dict(self):
        response_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}
        response_dict = {**response_dict}
        response_dict['url'] = f'{app.config["API_URL"]}/responses/{response_dict["id"]}'
        del response_dict['extra']
        
        return response_dict

    def get_task_object(self):

        task_class = getattr(tasks, self.task.spec.spec['type'], BaseCovfeeTask)
        task_object = task_class(response=self)
        return task_object

    def get_dataframe(self):
        task_object = self.get_task_object()
        chunk_data, chunk_logs = self.get_ndarray()
        df = task_object.to_dataframe(chunk_data)
        return df

    def get_json(self, with_chunk_data=True):
        task_object = self.get_task_object()
        # if with_chunk_data:
        #     chunk_data, chunk_logs = self.get_ndarray()
        #     task_json = task_object.to_dict(self.data, chunk_data)
        # else:
        #     task_json = task_object.to_dict(self.data, None)
        return task_object.to_dict(with_chunk_data)

    def get_download_filename(self, task_index, response_index):
        if self.task.parent:
            # start with the parent name for children tasks
            return f'{self.task.parent.spec.spec["name"]}-{self.task.spec.spec["name"]}_{response_index:d}'
        else:
            # use the task id if available
            if self.task.spec.spec.get('id', False):
                return f'{task_index}_{self.task.spec.spec["id"]}_{response_index:d}'
            return f'{task_index}_{self.task.spec.spec["name"]}_{response_index:d}'

    def pack_chunks(self):
        chunks = self.chunks.order_by(Chunk.index.desc()).all()
        chunk_bytes = len(chunks).to_bytes(4, sys.byteorder)
        chunk_bytes += b''.join([chunk.data for chunk in chunks])
        return chunk_bytes

    def get_ndarray(self) -> Tuple[np.ndarray, Any]:
        """This method takes care of aggregating a list of binary data chunks into a single numpy array.

        Args:
            data_chunks (list[bytes]): list of chunks as sent from the server. Size of the chunks may vary.

        Returns:
            np.ndarray: single numpy array with the aggregated data
        """
        if not self.chunks.count():
            return None, None

        chunks = [chunk.unpack() for chunk in self.chunks.all()]

        idxs_chunks = list()
        data_chunks = list()
        logs_chunks = list()

        for chunk in chunks:
            data = chunk['data']
            chunk_length = chunk['chunkLength']

            if len(data) % chunk_length != 0:
                raise Exception('Chunk byte length is invalid.')
            bytes_per_record = len(data) // chunk_length

            if (bytes_per_record - 4) % 8 != 0:
                raise Exception(
                    'Number of data bytes per record is not an 8-multiple.')
            datapoints_per_record = (bytes_per_record - 4) // 8
            idxs_chunks.append(np.frombuffer(
                data,
                dtype=np.uint32,
                count=chunk_length,
                offset=0).astype(np.float64).reshape(-1, 1))
            data_chunks.append(np.frombuffer(
                data,
                dtype=np.float64,
                count=chunk_length * datapoints_per_record,
                offset=4 * chunk_length).reshape(-1, datapoints_per_record))
            logs_chunks.append(chunk['logs'])

        idxs = np.vstack(idxs_chunks)
        data = np.vstack(data_chunks)
        assert len(idxs) == len(data)

        return np.hstack([idxs, data]), [l for chunk in logs_chunks for l in chunk]

    def validate(self):
        task_object = self.get_task_object()
        chunk_data, chunk_logs = self.get_ndarray()
        self.valid = task_object.validate(self.data, chunk_data, chunk_logs)
        return self.valid

    def submit(self, response=None):
        
        validation_result = self.validate()
        
        if response is not None:
            self.data = response
        self.submitted = True
        self.submitted_at = datetime.datetime.now()
        self.valid = (validation_result == True)
        self.task.has_unsubmitted_response = False

        res = {
            'status': 'success',
            'valid': self.valid,
            'response': self.as_dict()
        }

        if not self.valid:
            res['reason'] = validation_result

        return res