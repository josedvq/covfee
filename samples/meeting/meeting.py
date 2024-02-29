# from covfee import Task, HIT
from covfee import Project, HIT, Journey, tasks
from covfee.config import config
from covfee.shared.dataclass import CovfeeApp

config.load_environment("local")

spec_meeting = {
    "name": "Videocall",
}

t1 = tasks.VideocallTaskSpec(**spec_meeting)
hit = HIT("Joint counter")
hit.add_journey(nodes=[t1])

projects = [Project("My Project", email="example@example.com", hits=[hit])]
app = CovfeeApp(projects)
