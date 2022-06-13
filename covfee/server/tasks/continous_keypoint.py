import pandas as pd
from .base import BaseCovfeeTask


class ContinuousKeypointTask(BaseCovfeeTask):

    def process_response(result, chunks, hit, task):
        return {
            'hit_name': hit.spec.name,
            'task_name': task.spec.name,
            'data': [x for y in chunks for x in y]
        }
