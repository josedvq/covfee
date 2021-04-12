from .base import BaseCovfeeTask


class Continuous1DTask(BaseCovfeeTask):

    def aggregate_chunks(self, chunks):
        # concatenate all chunks together
        return [x for y in chunks for x in y]
