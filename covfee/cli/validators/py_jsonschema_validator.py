from jsonschema import Draft7Validator
from jsonschema.exceptions import ValidationError as JsonValidationError

from .validation_errors import ValidationError

class PyJsonschemaValidator:

    def __init__(self, schemata):
        self.schemata = schemata

        self.task_types = [
            'Continuous1DTask',
            'ContinuousKeypointTask',
            'InstructionsTask',
            'QuestionnaireTask'
        ]

    def jsonschema_validate(self, schema_name, instance):
        schema = self.schemata['definitions'][schema_name]
        del self.schemata['definitions'][schema_name]

        print(schema)
        schema['definitions'] = self.schemata['definitions']
        # jsonschema.validate(schema=schema, instance=instance)
        Draft7Validator(schema).validate(instance)
        del schema['definitions']
        self.schemata['definitions'][schema_name] = schema

    def validate_project(self, project_spec):
        try:
            self.jsonschema_validate('ProjectSpec', project_spec)
            # jsonschema.validate(schema=schemata.project, instance=project_spec)
        except JsonValidationError as json_err:
            raise ValidationError(json_err.message, json_err.path, json_err.instance)

        for i, hit in enumerate(project_spec['hits']):
            try:
                self.validate_hit(hit)
            except ValidationError as err:
                err.append_path('hits', i)
                raise err

        return True


    def validate_hit(self, hit_spec):
        if 'type' not in hit_spec:
            raise ValidationError('The type of the hit must be specified in its \'type\' attribute.', None, hit_spec)

        try:
            if hit_spec['type'] == 'timeline':
                self.jsonschema_validate('TimelineHitSpec', hit_spec)
                # jsonschema.validate(schema=schemata.timeline_hit, instance=hit_spec)
            elif hit_spec['type'] == 'annotation':
                self.jsonschema_validate('AnnotationHitSpec', hit_spec)
                # jsonschema.validate(schema=schemata.annotation_hit, instance=hit_spec)
            else:
                raise ValidationError('Invalid value for \'type\'. Must be one of [\'timeline\', \'annotation\']', None, hit_spec)
        except JsonValidationError as json_err:
            raise ValidationError(json_err.message, json_err.path, json_err.instance)

        for i, task_spec in enumerate(hit_spec['tasks']):
            try:
                self.validate_task(task_spec)
            except ValidationError as err:
                err.append_path('tasks', i)
                raise err


    def validate_task(self, task_spec):
        if 'type' not in task_spec:
            raise ValidationError('The type of the task must be specified in its \'type\' attribute.', None)

        if task_spec['type'][-10:] == 'CustomTask':
            # only validate the base task spec fields for custom tasks
            try:
                self.jsonschema_validate('BaseTaskSpec', task_spec)
                # jsonschema.validate(schema=schemata.base_task, instance=task_spec)
            except JsonValidationError as json_err:
                raise ValidationError(json_err.message, json_err.path, json_err.instance)
        else:
            if task_spec['type'] not in self.task_types:
                raise ValidationError(f'The \'type\' attribute must be one of the available task names.', None, task_spec)

            try:
                self.jsonschema_validate(task_spec['type']+'Spec', task_spec)
                # jsonschema.validate(schema=schemata.tasks[task_spec['type']], instance=task_spec)
            except JsonValidationError as json_err:
                raise ValidationError(json_err.message, json_err.path, json_err.instance)