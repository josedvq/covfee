from covfee.server.orm import app
import os
import click
import json

from halo import Halo
from colorama import init, Fore
init()

from .utils import look_for_covfee_files, working_directory
from .schemata import SchemataProcessor
from .validators.ajv_validator import AjvValidator
from .validators.validation_errors import ValidationError

def make_schemata():
    shared_path = app.config['SHARED_PATH']
    with working_directory(shared_path):
        os.system(f'npx typescript-json-schema tsconfig.json "*" --titles --ignoreErrors --required -o {app.config["DOCS_SCHEMATA_PATH"]}')

    # process the schemata for validation
    processor = SchemataProcessor(json.load(open(app.config["DOCS_SCHEMATA_PATH"])))
    processor.process()
    processor.save(open(app.config['FILTER_SCHEMATA_PATH'], 'w'))


def cli_make_schemata():
    with Halo(text='Making JSON schemata', spinner='dots') as spinner:
        make_schemata()
        spinner.succeed('Generated JSON schemata')


cmd_make_schemata = click.command()(cli_make_schemata)


def cli_get_schemata(remake=False):
    # first create the schemata
    schemata_path = app.config['DOCS_SCHEMATA_PATH']
    if remake or not os.path.exists(schemata_path):
        cli_make_schemata()

    with Halo(text='Loading generated schemata', spinner='dots') as spinner:
        schemata = json.load(open(schemata_path))
        spinner.succeed('Loaded JSON schemata')
    return schemata


def cli_validate_project(project_spec, filename):
    filter = AjvValidator()
    with Halo(text=f'Validating project {project_spec["name"]} in {filename}', spinner='dots') as spinner:
        try:
            filter.validate_project(project_spec)
        except ValidationError as err:
            spinner.fail(f'Error validating project \"{project_spec["name"]}\" in {filename}.\n')
            err.print_friendly()
            return False

        spinner.succeed(f'Project \"{project_spec["name"]}\" in {filename} is valid.')
    return True


@click.command()
@click.option("--output", '-o', help="Write filtered .covfee.json to a new file.")
@click.argument("file_or_folder")
def cmd_validate(file_or_folder, output):
    with Halo(text='Looking for .covfee.json files', spinner='dots') as spinner:
        covfee_files = look_for_covfee_files(file_or_folder)

        if covfee_files is None:
            spinner.fail(f'Path {file_or_folder} does not point to a file or folder.')
            return

    for cf in covfee_files:
        with Halo(text=f'Reading file {cf}', spinner='dots') as spinner:
            project_spec = json.load(cf)
            cli_validate_project(project_spec, cf)
