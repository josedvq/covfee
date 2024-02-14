from covfee import tasks, HIT, Project
from covfee.config import config
from covfee.shared.dataclass import CovfeeApp

config.load_environment("local")

my_task_1 = tasks.ActionAnnotationTaskSpec(name="My Task 1", input=None, media=None)

hit = HIT("Joint counter")
j1 = hit.add_journey(nodes=[my_task_1])

projects = [Project("My Project", email="example@example.com", hits=[hit])]
app = CovfeeApp(projects)
