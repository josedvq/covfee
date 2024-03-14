from covfee import tasks, HIT, Project
from covfee.config import config
from covfee.shared.dataclass import CovfeeApp

config.load_environment("local")

my_task_1 = tasks.ContinuousAnnotationTaskSpec(
    name="My Task 1",
    annotations=[
        {"category": "Speaking", "interface": "Binary", "participant": "Participant_1"},
        {"category": "Laughing", "interface": "Binary", "participant": "Participant_1"},
        {"category": "Jumping", "interface": "Binary", "participant": "Participant_2"},
    ],
    media=[{
        "type": "video",
        "url": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    }, {
        "type": "video",
        "url": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    }, {
        "type": "video",
        "url": "https://file-examples.com/storage/fec71f2ebe65d8e339e8b9c/2017/04/file_example_MP4_640_3MG.mp4",
    }, {
        "type": "video",
        "url": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    }, {
        "type": "video",
        "url": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    }],
    userCanAdd=False,
)

hit = HIT("Joint counter")
j1 = hit.add_journey(nodes=[my_task_1])

projects = [Project("My Project", email="example@example.com", hits=[hit])]
app = CovfeeApp(projects)
