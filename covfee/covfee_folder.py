import os
import shutil
import sys
import subprocess
import random
import traceback
import platform

from flask import current_app as app
from halo import Halo
from colorama import init as colorama_init, Fore

from covfee.server.db import metadata, engine
from covfee.server.orm.user import User, password_hash
from covfee.cli.utils import working_directory
from pathlib import Path
from covfee.shared.validator.ajv_validator import AjvValidator
import json
from covfee.server.orm.project import Project

colorama_init()


def cli_create_tables():
    '''
    Creates all the tables defined in the ORM
    '''
    with Halo(text='Creating tables', spinner='dots') as spinner:
        metadata.create_all(engine)
        spinner.succeed('Created database tables.')


class CovfeeProject:
    ''' Translates between different covfee file formats    
    '''

    def __init__(self, working_dir=None):
        if working_dir is not None and not os.path.isdir(working_dir):
            raise FileNotFoundError('covfee folder must be a valid folder.')
        self.working_dir = working_dir
        self.covfee_files = []
        self.projects = []

    def add_file_or_folder(self, file_or_folder):
        if os.path.isdir(file_or_folder):
            for json_path in Path(file_or_folder).rglob('*.covfee.json'):
                self.covfee_files.append(json_path)
        elif os.path.isfile(file_or_folder):
            self.covfee_files.append(file_or_folder)

    def parse(self, with_spinner=True):
        for cf in self.covfee_files:
            # load the json file
            with Halo(text=f'Reading file {cf} as json..',
                      spinner='dots',
                      enabled=with_spinner) as spinner:
                try:
                    project_spec = json.load(open(cf))
                except Exception as e:
                    spinner.fail(f'Error reading file {cf} as JSON. Are you sure it is valid json?')
                    raise e
                
                self.projects.append(project_spec)
                spinner.succeed(f'Read covfee file {cf}.')

    # def is_project(self):
    #     return os.path.exists(app.config['DATABASE_PATH'])

    # def clear(self):
    #     shutil.rmtree(os.path.join(self.path, '.covfee'))

    def init(self):
        covfee_hidden = os.path.join(self.working_dir, '.covfee')
        if not os.path.exists(covfee_hidden):
            os.makedirs(covfee_hidden)
        media_path = os.path.join(self.working_dir, 'www', 'media')
        if not os.path.exists(media_path):
            os.makedirs(media_path)
        cli_create_tables()
    

    def link_bundles(self):
        master_bundle_path = os.path.join(app.config['MASTER_BUNDLE_PATH'], 'main.js')
        if not os.path.exists(master_bundle_path):
            raise Exception('Master bundles not found.')
        bundle_path = os.path.join(app.config['PROJECT_WWW_PATH'], 'main.js')
        if os.path.exists(bundle_path):
            os.remove(bundle_path)
        # windows requires admin rights for symlinking -> fall back to copying
        if(platform.system() == 'Windows'):
            shutil.copyfile(
                master_bundle_path,
                bundle_path
            )
        else:
            os.symlink(
                master_bundle_path,
                bundle_path
            )

        admin_bundle_path = os.path.join(app.config['PROJECT_WWW_PATH'], 'admin.js')
        if os.path.exists(admin_bundle_path):
            os.remove(admin_bundle_path)
        if(platform.system() == 'Windows'):
            shutil.copyfile(
                os.path.join(app.config['MASTER_BUNDLE_PATH'], 'admin.js'),
                admin_bundle_path
            )
        else:
            os.symlink(
                os.path.join(app.config['MASTER_BUNDLE_PATH'], 'admin.js'),
                admin_bundle_path
            )
