class Schemata:
    def __init__(self, schemata):
        self.project = schemata['definitions']['ProjectSpec']
        self.hit = schemata['definitions']['HitSpec']

        self.annotation_hit = schemata['definitions']['AnnotationHitSpec']
        self.timeline_hit = schemata['definitions']['TimelineHitSpec']

        self.base_task = schemata['definitions']['BaseTaskSpec']
        self.task_types = [
            'Continuous1DTask',
            'ContinuousKeypointTask',
            'InstructionsTask',
            'QuestionnaireTask'
        ]
        self.tasks = {
            name: schemata['definitions'][name + 'Spec'] for name in self.task_types
        }
