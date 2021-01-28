import pandas as pd
class ContinuousKeypointTask:
    def __init__(self):
        pass

    @staticmethod
    def process_response(result, chunks, hitinstance, task):
        return {
            'hit_name': hitinstance.hit.name,
            'task_name': task.name,
            'data': [x for y in chunks for x in y]
        }

    @staticmethod
    def to_dataframe(response):
        # remove all the log events that are not data points
        filtered = filter(lambda x: len(x) == 7, response['data'])
        df = pd.DataFrame(filtered, columns=['index', 'timestamp', 'frame', 'x', 'y', 'valid', 'occluded'])
        return df
