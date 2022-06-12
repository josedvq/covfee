from sqlalchemy.orm import declarative_base
from sqlalchemy import Column, Integer, LargeBinary, JSON, ForeignKey

Base = declarative_base()

# represents a chunk of task response (for continuous responses)
class Chunk(Base):
    """ Represents a chunk of or partial task response"""
    __tablename__ = 'chunks'

    # (taskresponse, index) must be unique
    index = Column(Integer, primary_key=True)
    taskresponse_id = Column(Integer, ForeignKey(
        'taskresponses.id'), primary_key=True)
    # ini_time = Column(Float, index=True)
    # end_time = Column(Float, index=True)

    data = Column(LargeBinary)
    length = Column(Integer)   # number of samples in data
    log_data = Column(JSON, nullable=True)

    def __init__(self, index, data, length, log_data=None):
        self.index = index
        self.update(data, length, log_data)

    def update(self, data, length, log_data=None):
        self.data = data
        self.length = length
        self.log_data = log_data
        # self.ini_time = data[0][0]
        # self.end_time = data[-1][0]

    def as_dict(self):
        chunk_dict = {c.name: getattr(
            self, c.name) for c in self.__table__.columns}
        return chunk_dict

    def unpack(self):
        packer = Packer()
        parsed = packer.parseChunk(self.data)
        return parsed