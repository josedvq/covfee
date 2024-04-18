from covfee import tasks, HIT, Project
from covfee.config import config
from covfee.shared.dataclass import CovfeeApp

config.load_environment("local")

hit = HIT("Joint counter")
for i in range(3):
    my_task_1 = tasks.ContinuousAnnotationTaskSpec(
        name="My Task 1",
        annotations=[
            {"category": "Speaking", "interface": "Binary", "participant": "Participant_1"},
            {"category": "Laughing", "interface": "Binary", "participant": "Participant_1"},
            {"category": "Jumping", "interface": "Binary", "participant": "Participant_2"},
            {"category": "Speaking", "interface": "Binary", "participant": "Participant_42"},
            
        ],
        media=[{
            "type": "video/mp4",
            "src": "https://www.shutterstock.com/shutterstock/videos/1080381158/preview/stock-footage--seconds-simple-countdown-timer.mp4",
        }, {
            "type": "video/mp4",
            "src": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        }, {
            "type": "video/mp4",
            "src": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        }, {
            "type": "video/mp4",
            "src": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        }, {
            "type": "video/mp4",
            "src": "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        }],
        prolificCompletionCode="D1F2DGU1",
        userCanAdd=False,
    )

    j1 = hit.add_journey(nodes=[my_task_1])

projects = [Project("My Project", email="example@example.com", hits=[hit])]
app = CovfeeApp(projects)

