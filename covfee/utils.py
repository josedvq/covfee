import os

from halo.halo import Halo
from flask import current_app as app
from covfee.server.start import create_app
from covfee.shared.schemata import Schemata

from covfee.shared.validator.validation_errors import ValidationError
from .covfee_folder import CovfeeFolder

def covfee_make(file_or_folder, force=False, rms=False, stdout_enabled=True):
    
    project_folder = CovfeeFolder(os.getcwd())

    # add the covfee files to the project
    with Halo(text='Adding .covfee.json files', spinner='dots', enabled=stdout_enabled) as spinner:
        covfee_files = project_folder.add_covfee_files(file_or_folder)

        if len(covfee_files) == 0:
            err = f'No valid covfee files found. Make sure that {file_or_folder} points to a file or to a folder containing .covfee.json files.'
            spinner.fail(err)
            raise FileNotFoundError(err)

        spinner.succeed(f'{len(covfee_files)} covfee project files found.')

    # validate the covfee files
    schema = Schemata()
    if rms or not schema.exists():
        schema.make()
    
    project_folder.validate(with_spinner=stdout_enabled)

    # init project folder if necessary
    if not project_folder.is_project():
        project_folder.init()
    project_folder.push_projects(force=force, with_spinner=stdout_enabled)

    # link bundles
    with Halo(text='Linking covfee bundles', spinner='dots', enabled=stdout_enabled) as spinner:
        try:
            project_folder.link_bundles()
        except Exception as e:
            spinner.fail('Error linking bundles. Aborted.')
            raise e
        spinner.succeed('covfee bundles linked.')


def make(*args, **kwargs):
    _, app = create_app('local')
    with app.app_context():
        return covfee_make(*args, **kwargs, stdout_enabled=False)

def get_start_message(config, unsafe):
    url = config["ADMIN_URL"] if unsafe else config["LOGIN_URL"]
    msg = r'''
                      __             
  ___   ___  __   __ / _|  ___   ___ 
 / __| / _ \ \ \ / /| |_  / _ \ / _ \
| (__ | (_) | \ V / |  _||  __/|  __/
 \___| \___/   \_/  |_|   \___| \___|'''
    msg += f'\nURL: {url}'
    return msg
