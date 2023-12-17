# from covfee import Task, HIT
from covfee import Project, HIT, Journey, tasks
from covfee.config import config
from covfee.shared.dataclass import CovfeeApp

config.load_environment("local")

spec_consent_form = {
    "name": "Consent",
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
    "timer": 10,
}

spec_instructions = {
    "name": "Instructions",
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

spec_videocall = {
    "name": "Videocall",
}

spec_final_survey = {
    "name": "Final Survey",
    "form": {
        "fields": [
            {
                "name": "enjoyment",
                "label": "Did you enjoy your interaction?",
                "required": True,
                "input": {
                    "inputType": "Radio.Group",
                    "options": ["Yes", "No"],
                },
            }
        ]
    },
}

j1_consent = tasks.InstructionsTaskSpec(**spec_consent_form)
j1_instructions = tasks.InstructionsTaskSpec(**spec_instructions)
j1_final = tasks.QuestionnaireTaskSpec(**spec_final_survey)

j2_consent = tasks.InstructionsTaskSpec(**spec_consent_form)
j2_instructions = tasks.InstructionsTaskSpec(**spec_instructions)
j2_final = tasks.QuestionnaireTaskSpec(**spec_final_survey)

videocall_task = tasks.VideocallTaskSpec(**spec_videocall)

hit = HIT("Joint counter")
j1 = hit.add_journey(nodes=[j1_consent, j1_instructions, videocall_task, j1_final])
j1 = hit.add_journey(nodes=[j2_consent, j2_instructions, videocall_task, j2_final])

projects = [Project("My Project", email="example@example.com", hits=[hit])]
app = CovfeeApp(projects)
