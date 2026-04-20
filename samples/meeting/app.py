from covfee import HIT, Project, tasks
from covfee.shared.dataclass import CovfeeApp


spec_meeting = {
    "name": "Videocall",
    "serverRecording": {
        "hasAudio": True,
        "hasVideo": True,
        "outputMode": "INDIVIDUAL",
    },
}

t1 = tasks.VideocallTaskSpec(**spec_meeting)
hit = HIT("Joint counter")
hit.add_journey(nodes=[t1])

projects = [Project("My Project", email="example@example.com", hits=[hit])]
app = CovfeeApp(projects)
