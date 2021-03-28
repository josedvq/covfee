from covfee.server.orm import app
import os
import click
import json

import jsonschema
from jsonschema.exceptions import ValidationError as JsonValidationError
from halo import Halo
from .utils import look_for_covfee_files, working_directory
from .schemata import Schemata
import collections
from colorama import init, Fore
init()


class ValidationError(Exception):
    '''Tracks and reports JSON schema validation errors.'''

    def __init__(self, message, path=[], instance=None):

        # Call the base class constructor with the parameters it needs
        super().__init__(message)

        self.path = collections.deque()
        if type(path) == collections.deque:
            while True:
                try:
                    self.path.append(path.pop())
                except IndexError:
                    break
        elif type(path) == list:
            for idx in reversed(path):
                self.path.append(idx)

        self.instance = instance

    def append_path(self, *path_segments):
        for seg in reversed(path_segments):
            self.path.append(seg)

    def pop_path(self):
        self.path.pop()

    def get_python_path_string(self):
        '''Returns a string in python object access notation (using []) to the object where the error was generated.'''
        path_string = ''
        while True:
            try:
                path_segment = self.path.pop()
                if type(path_segment) == int:
                    path_string += f'[{path_segment}]'
                elif type(path_segment) == str:
                    path_string += f'["{path_segment}"]'
            except IndexError:
                return path_string

    def print_friendly(self):
        print(f'\nError in project{self.get_python_path_string()} for object: ')
        print(json.dumps(self.instance, indent=4))
        print(Fore.RED+str(self))


def make_schemata():
    shared_path = app.config['SHARED_PATH']
    schemata_path = app.config['SCHEMATA_PATH']
    with working_directory(shared_path):
        os.system(
            f'npx typescript-json-schema tsconfig.json "*" --refs false --titles --defaultProps --ignoreErrors --required -o {schemata_path}')


def cli_make_schemata():
    with Halo(text='Making JSON schemata', spinner='dots') as spinner:
        make_schemata()
        spinner.succeed('Generated JSON schemata')


cmd_make_schemata = click.command()(cli_make_schemata)


def cli_get_schemata(remake=False):
    # first create the schemata
    schemata_path = app.config['SCHEMATA_PATH']
    if remake or not os.path.exists(schemata_path):
        cli_make_schemata()

    with Halo(text='Loading generated schemata', spinner='dots') as spinner:
        schemata = Schemata(json.load(open(schemata_path)))
        spinner.succeed('Loaded JSON schemata')
    return schemata


@click.command()
@click.option("--output", '-o', help="Write filtered .covfee.json to a new file.")
@click.argument("file_or_folder")
def cmd_validate(file_or_folder, output):
    schemata = cli_get_schemata

    with Halo(text='Looking for .covfee.json files', spinner='dots') as spinner:
        covfee_files = look_for_covfee_files(file_or_folder)

        if covfee_files is None:
            spinner.fail(f'Path {file_or_folder} does not point to a file or folder.')
            return

    for cf in covfee_files:
        with Halo(text=f'Reading file {cf}', spinner='dots') as spinner:
            with open(cf) as f:
                project_spec = json.load(f)
            cli_validate_project(schemata, project_spec, cf)


def cli_validate_project(schemata, project_spec, filename):
    with Halo(text=f'Validating project {project_spec["name"]} in {filename}', spinner='dots') as spinner:
        try:
            validate_project(schemata, project_spec)
        except ValidationError as err:
            spinner.fail(f'Error validating project \"{project_spec["name"]}\" in {filename}.\n')
            err.print_friendly()
            return False

        spinner.succeed(f'Project \"{project_spec["name"]}\" in {filename} is valid.')
    return True


def validate_project(schemata, project_spec):
    try:
        jsonschema.validate(schema=schemata.project, instance=project_spec)
    except JsonValidationError as json_err:
        raise ValidationError(json_err.message, json_err.path, json_err.instance)

    for i, hit in enumerate(project_spec['hits']):
        try:
            validate_hit(schemata, hit)
        except ValidationError as err:
            err.append_path('hits', i)
            raise err

    return True


def validate_hit(schemata, hit_spec):
    if 'type' not in hit_spec:
        raise ValidationError('The type of the hit must be specified in its \'type\' attribute.', None, hit_spec)

    try:
        if hit_spec['type'] == 'timeline':
            jsonschema.validate(schema=schemata.timeline_hit, instance=hit_spec)
        elif hit_spec['type'] == 'annotation':
            jsonschema.validate(schema=schemata.annotation_hit, instance=hit_spec)
        else:
            raise ValidationError('Invalid value for \'type\'. Must be one of [\'timeline\', \'annotation\']', None, hit_spec)
    except JsonValidationError as json_err:
        raise ValidationError(json_err.message, json_err.path, json_err.instance)

    for i, task_spec in enumerate(hit_spec['tasks']):
        try:
            validate_task(schemata, task_spec)
        except ValidationError as err:
            err.append_path('tasks', i)
            raise err


def validate_task(schemata, task_spec):
    if 'type' not in task_spec:
        raise ValidationError('The type of the task must be specified in its \'type\' attribute.', None)

    if task_spec['type'][-10:] == 'CustomTask':
        # only validate the base task spec fields for custom tasks
        try:
            jsonschema.validate(schema=schemata.base_task, instance=task_spec)
        except JsonValidationError as json_err:
            raise ValidationError(json_err.message, json_err.path, json_err.instance)
    else:
        if task_spec['type'] not in schemata.task_types:
            raise ValidationError(f'The \'type\' attribute must be one of the available task names: {list(schemata.tasks.keys())}', None, task_spec)

        try:
            jsonschema.validate(schema=schemata.tasks[task_spec['type']], instance=task_spec)
        except JsonValidationError as json_err:
            raise ValidationError(json_err.message, json_err.path, json_err.instance)
