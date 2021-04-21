import pandas as pd
from .base import BaseCovfeeTask


class ContinuousKeypointTask(BaseCovfeeTask):

    def process_response(result, chunks, hitinstance, task):
        return {
            'hit_name': hitinstance.hit.name,
            'task_name': task.spec.name,
            'data': [x for y in chunks for x in y]
        }
