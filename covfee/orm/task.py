from .orm import db, app

class Task(db.Model):
    """ Represents a single task, like eg. annotating one video """
    __tablename__ = 'tasks'

    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String)
    name = db.Column(db.String)
    props = db.Column(db.JSON)
    # backref hit
    # backref hitinstance

    def __init__(self, type, name=None, props=None):
        self.type = type
        self.name = name

        # fix URLs
        if props and props.media:
            for k, v in props.media.items():
                if k[-3:] == 'url' and v[:4] != 'http':
                    props.media[k] = app.config['MEDIA_URL'] + '/' + v

        self.props = props

    @staticmethod
    def from_dict(task_dict):
        return Task(**task_dict)

    def as_dict(self):
       task_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}
       return task_dict

    def __str__(self):
        return f'{self.name}: chunks={len(self.chunks):d}'

    def __repr__(self):
        return str(self)


class TaskResponse(db.Model):
    """ Represents a task's response """
    __tablename__ = 'taskresponses'

    id = db.Column(db.Integer, primary_key=True)
    # for numbering multiple response submissions
    index = db.Column(db.Integer)
    submitted = db.Column(db.Boolean)
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id'))
    hitinstance_id = db.Column(db.Binary, db.ForeignKey('hitinstances.id'))
    data = db.Column(db.JSON)
    chunks = db.relationship("Chunk", backref='taskresponse')

    def __init__(self, task_id, hitinstance_id, index, submitted=False, data=None, chunks=None):
        self.task_id = task_id
        self.hitinstance_id = hitinstance_id
        self.index = index
        self.submitted = submitted
        self.data = data
        self.chunks = chunks

    def as_dict(self):
        response_dict = {c.name: getattr(self, c.name)
            for c in self.__table__.columns}

        return response_dict

# represents a chunk of task response (for continuous responses)
class Chunk(db.Model):
    """ Represents a chunk of or partial task response"""
    __tablename__ = 'chunks'

    id = db.Column(db.Integer, primary_key=True)
    # for order-keeping of the chunks
    index = db.Column(db.Integer)
    taskresponse_id = db.Column(db.Integer, db.ForeignKey('taskresponses.id'))
    data = db.Column(db.JSON)

    def __init__(self, index, data, submission=None):
        self.index = index
        self.data = data
        self.submission = submission

    def __str__(self):
        return f' idx={self.index} - sub={self.submission:d}'

    def __repr__(self):
        return str(self)
