class BaseCovfeeTask:
    def __init__(self, name):
        self.name = name

    def aggregate(self, chunk_data=None, log_data=None, rwnd_data=None):
        return ()

    def validate(self, response, chunk_data=None, log_data=None, rwnd_data=None):
        return True
