# from covfee import Task, HIT
from covfee import Project, HIT, Journey, tasks
from covfee.config import config

config.load_environment("local")

task1 = tasks.InstructionsTaskSpec(
    name="Consent",
    prerequisite=True,
    content={"type": "link", "url": "$$www$$/consent.md"},
    form={
        "fields": [
            {
                "name": "name",
                "label": "Full name:",
                "required": True,
                "input": {"inputType": "Input"},
            },
            {
                "name": "consent",
                "label": "To proceed, you must expressly provide consent per the terms above.",
                "required": True,
                "input": {
                    "inputType": "Checkbox.Group",
                    "options": [
                        {
                            "label": "I consent to the sharing of my personal data.",
                            "value": "yes",
                        }
                    ],
                },
            },
        ]
    },
)

task2 = tasks.InstructionsTaskSpec(
    name="Instructions",
    prerequisite=True,
    content={"type": "link", "url": "$$www$$/instructions.md"},
    form={
        "fields": [
            {
                "name": "agreement",
                "label": "To proceed, you must expressly agree to the provided instructions.",
                "required": True,
                "input": {
                    "inputType": "Checkbox.Group",
                    "options": [
                        {
                            "label": "I agree with the provided instructions.",
                            "value": "yes",
                        }
                    ],
                },
            }
        ]
    },
)


j1_start = tasks.IncrementCounterTaskSpec(name="Counter", useSharedState=False)

j1_end = tasks.IncrementCounterTaskSpec(name="Counter", useSharedState=False)
joint_task1 = tasks.IncrementCounterTaskSpec(name="Counter", useSharedState=False)
joint_task2 = tasks.IncrementCounterTaskSpec(name="Counter", useSharedState=False)
joint_task3 = tasks.IncrementCounterTaskSpec(name="Counter", useSharedState=False)

j2_start = tasks.IncrementCounterTaskSpec(name="Counter", useSharedState=False)
j2_end = tasks.IncrementCounterTaskSpec(name="Counter", useSharedState=False)

hit = HIT("Joint counter")
j1 = hit.add_journey(nodes=[j1_start, joint_task1, joint_task2, joint_task3, j1_end])
j2 = hit.add_journey(nodes=[j2_start, joint_task1, joint_task2, joint_task3, j2_end])

linear = HIT("Linear")
nodes = [
    tasks.IncrementCounterTaskSpec(name="Counter", useSharedState=False)
    for _ in range(15)
]
j1 = linear.add_journey(nodes)

project = Project("My Project", email="example@example.com", hits=[hit, linear])
project.launch()
