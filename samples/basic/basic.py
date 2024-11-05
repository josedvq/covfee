# from covfee import Task, HIT
from covfee import HIT, CovfeeApp, Project, tasks
from covfee.config import config

config.load_environment("local")

task_demographics = tasks.QuestionnaireTaskSpec(
    name="Demographics",
    form={
        "fields": [
        {
            "name": "age",
            "label": "Your age:",
            "input": {
            "inputType": "InputNumber"
            }
        },
        {
            "name": "sex",
            "label": "Your sex:",
            "input": {
            "inputType": "Select",
            "options": [
                {"label": "Male", "value": "m"},
                {"label": "Female", "value": "f"}
            ]
            }
        },
        {
            "name": "nationality",
            "label": "Your nationality:",
            "input": {
            "inputType": "Input"
            }
        }
        ]
    }
)

task_instructions = tasks.InstructionsTaskSpec(
    name="Instructions",
    content= {
        "type": "link",
        "url": "$$www$$/instructions.md"
    }
)

task_feedback = tasks.QuestionnaireTaskSpec(
    name="Feedback",
    form={
        "fields": [
            {
                "name": "rating",
                "label": "How would you rate your experience in completing this experiment?",
                "required": True,
                "input": {
                    "inputType": "Rate",
                    "allowHalf": True
                }
            },{
                "name": "feedback",
                "label": "Do you have any comments that can help us improve the experience?",
                "input": {
                    "inputType": "Input.TextArea"
                }
            }
        ]
    }
)

hit = HIT("Basic annotation")
j1 = hit.add_journey(nodes=[task_demographics, task_instructions, task_feedback])



projects = [Project("My Project", email="example@example.com", hits=[hit])]
app = CovfeeApp(projects)
