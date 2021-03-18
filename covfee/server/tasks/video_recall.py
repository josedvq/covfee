class VideoRecallTask:
    def __init__(self):
        pass

    @staticmethod
    def aggregate_chunks(chunks):
        # concatenate all chunks together
        return [x for y in chunks for x in y]
