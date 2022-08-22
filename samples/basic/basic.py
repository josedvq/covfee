from covfee import Task, Journey

task1 = Task(spec={
    "name": "Consent",
    "type": "InstructionsTask",
    "prerequisite": True,
    "content": {
        "type": "link",
        "url": "$$www$$/consent.md"
    },
    "form": {
        "fields": [
            {
                "name": "name",
                "label": "Full name:",
                "required": True,
                "input": {
                    "inputType": "Input"
                }
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
                            "value": "yes"
                        }
                    ]
                }
            }
        ]
    }
})

task2 = Task(spec={
    "name": "Instructions",
    "type": "InstructionsTask",
    "prerequisite": True,
    "content": {
        "type": "link",
        "url": "$$www$$/instructions.md"
    },
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
                            "value": "yes"
                        }
                    ]
                }
            }
        ]
    }
})

j1 = Journey()
j1 = task1(j1)
j1 = task2(j1)
j1.launch()