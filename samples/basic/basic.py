# from covfee import Task, HIT
from covfee.server.orm import *

task1 = TaskSpec(
    spec={
        "name": "Consent",
        "type": "InstructionsTask",
        "prerequisite": True,
        "content": {"type": "link", "url": "$$www$$/consent.md"},
        "form": {
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
    }
)

task2 = TaskSpec(
    spec={
        "name": "Instructions",
        "type": "InstructionsTask",
        "prerequisite": True,
        "content": {"type": "link", "url": "$$www$$/instructions.md"},
        "form": {
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
    }
)

project = Project()

j1_start = TaskSpec(spec={"name": "Counter", "type": "IncrementCounterTask"})
j1_end = TaskSpec(spec={"name": "Counter", "type": "IncrementCounterTask"})
joint_task1 = TaskSpec(spec={"name": "Counter", "type": "IncrementCounterTask"})
joint_task2 = TaskSpec(spec={"name": "Counter", "type": "IncrementCounterTask"})
joint_task3 = TaskSpec(spec={"name": "Counter", "type": "IncrementCounterTask"})

j2_start = TaskSpec(spec={"name": "Counter", "type": "IncrementCounterTask"})
j2_end = TaskSpec(spec={"name": "Counter", "type": "IncrementCounterTask"})

hit = HITSpec()
j1 = hit.make_journey()
j2 = hit.make_journey()

j1 = j1_start(j1)
j1 = joint_task1(j1)
j1 = joint_task2(j1)
j1 = joint_task3(j1)
j1 = j1_end(j1)

j2 = j2_start(j2)
j2 = joint_task1(j2)
j2 = joint_task2(j2)
j2 = joint_task3(j2)
j2 = j2_end(j2)
# j1 = task1(j1)
# j1 = task2(j1)

linear = HITSpec()
j1 = linear.make_journey()
for i in range(25):
    t = TaskSpec(spec={"name": "Counter", "type": "IncrementCounterTask"})
    j1 = t(j1)


project.hitspecs = [hit, linear]
project.launch()
