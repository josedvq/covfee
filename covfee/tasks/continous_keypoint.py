import pandas as pd
class ContinuousKeypointTask:
    def __init__(self):
        pass

    @staticmethod
    def aggregate_chunks(chunks):
        # concatenate all chunks together
        return [x for y in chunks for x in y]

    @staticmethod
    def to_dataframe(data):
        # remove all the log events that are not data points
        filtered = filter(lambda x: len(x) == 7, data)
        df = pd.DataFrame(filtered, columns=['index', 'timestamp', 'frame', 'x', 'y', 'valid', 'occluded'])
        return df