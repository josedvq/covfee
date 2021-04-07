import os
import shutil
import sys

from flask import current_app as app
from halo import Halo
from colorama import init as colorama_init, Fore

from ..server.orm import db
from ..server.orm.user import User
from covfee.cli.utils import working_directory
from pathlib import Path
from covfee.cli.validators.ajv_validator import AjvValidator
from covfee.cli.validators.validation_errors import ValidationError
import json
from covfee.server.orm.project import Project
from shutil import which
colorama_init()


def cli_create_tables():
    '''
    Creates all the tables defined in the ORM
    '''
    with Halo(text='Creating tables', spinner='dots') as spinner:
        db.create_all()
        spinner.succeed('Created database tables.')


class ProjectExistsException(Exception):
    pass


class CovfeeFolder:

    def __init__(self, path):
        if not os.path.isdir(path):
            raise FileNotFoundError('covfee folder must be a valid folder.')
        self.path = path
        self.covfee_files = []
        self.projects = []

    def is_project(self):
        return os.path.exists(app.config['DATABASE_PATH'])

    def clear(self):
        shutil.rmtree(os.path.join(self.path, '.covfee'))

    def init(self):
        covfee_hidden = os.path.join(self.path, '.covfee')
        if not os.path.exists(covfee_hidden):
            os.makedirs(covfee_hidden)
        media_path = os.path.join(self.path, 'www', 'media')
        if not os.path.exists(media_path):
            os.makedirs(media_path)
        cli_create_tables()

    def add_covfee_files(self, file_or_folder):
        self.covfee_files = []

        # database exists and tables are created
        if os.path.isdir(file_or_folder):
            for json_path in Path(file_or_folder).rglob('*.covfee.json'):
                self.covfee_files.append(json_path)
        elif os.path.isfile(file_or_folder):
            self.covfee_files.append(file_or_folder)

        return self.covfee_files

    def validate_project(self, project_spec, filename, with_spinner=False):
        filter = AjvValidator()
        filter.validate_project(project_spec)

    def validate(self, with_spinner=False):
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

            with Halo(text=f'Validating project {project_spec["name"]} in {cf}',
                      spinner='dots',
                      enabled=with_spinner) as spinner:

                try:
                    self.validate_project(project_spec, cf, with_spinner=with_spinner)
                except ValidationError as e:
                    spinner.fail(f'Error validating project \"{project_spec["name"]}\" in {cf}.\n')
                    raise e
                self.projects.append((project_spec, cf))
                spinner.succeed(f'Project \"{project_spec["name"]}\" in {cf} is valid.')

    def push_projects(self, force=False, interactive=False):
        for project_spec, cf in self.projects:
            # delete existing project with the same id
            with Halo(text=f'Looking for existing projects with id {project_spec["id"]}',
                      spinner='dots',
                      enabled=interactive) as spinner:

                projid = Project.get_id(project_spec['id'])
                existing_project = Project.query.filter_by(id=projid).first()
                if existing_project is not None:
                    if force:
                        db.session.delete(existing_project)
                        db.session.commit()
                        spinner.warn(
                            f'Deleted existing project with conflicting ID {project_spec["id"]}')
                    else:
                        spinner.fail(f'Project with ID {project_spec["id"]} already exists.')
                        raise ProjectExistsException('Project already exists in the database.')

            # making
            with Halo(text=f'Making project {project_spec["name"]} from file {cf}',
                      spinner='dots',
                      enabled=interactive) as spinner:
                project = Project(**project_spec)
                db.session.add(project)
                spinner.succeed(
                    f'Project {project_spec["name"]} created successfully from file {cf}')
        db.session.commit()

    def link_bundles(self):
        bundle_path = os.path.join(app.config['PROJECT_WWW_PATH'], 'main.js')
        if os.path.exists(bundle_path):
            os.remove(bundle_path)
        os.symlink(
            os.path.join(app.config['MASTER_BUNDLE_PATH'], 'main.js'),
            bundle_path
        )

        admin_bundle_path = os.path.join(app.config['PROJECT_WWW_PATH'], 'admin.js')
        if os.path.exists(admin_bundle_path):
            os.remove(admin_bundle_path)
        os.symlink(
            os.path.join(app.config['MASTER_BUNDLE_PATH'], 'admin.js'),
            admin_bundle_path
        )

    def launch_webpack(self):
        cwd = os.getcwd()
        # run the dev server
        with working_directory(app.config['COVFEE_CLIENT_PATH']):
            os.system('npx webpack serve' +
                      ' --env COVFEE_WD=' + cwd +
                      ' --config ./webpack.dev.js')

    def build(self):
        cwd = os.getcwd()

        bundle_path = app.config['PROJECT_WWW_PATH']

        with working_directory(app.config['COVFEE_CLIENT_PATH']):
            os.system('npx webpack' +
                      ' --env COVFEE_WD=' + cwd +
                      ' --config ./webpack.prod.js' + ' --output-path '+bundle_path)

    def launch_dev(self):
        # no need to build or link as bundle urls will point to webpack
        os.environ['UNSAFE_MODE_ON'] = 'enable'
        os.environ['FLASK_ENV'] = 'development'
        os.environ['FLASK_APP'] = 'covfee.server.start:create_app("dev")'
        os.system(sys.executable + ' -m flask run')

    def launch_in_browser(self, unsafe=False):
        target_url = app.config["ADMIN_URL"] if unsafe else app.config["LOGIN_URL"]
        if which('xdg-open') is not None:
            os.system(f'xdg-open {target_url}')
        elif sys.platform == 'darwin' and which('open') is not None:
            os.system(f'open {target_url}')
        else:
            print(Fore.GREEN +
                  f' * covfee is available at {target_url}')

    def launch_prod(self, unsafe=False, build=False, launch_browser=False):
        # build the bundle
        if build:
            self.build()
        else:
            self.link_bundles()

        if launch_browser:
            self.launch_in_browser(unsafe)

        if unsafe:
            os.environ['UNSAFE_MODE_ON'] = 'enable'
        os.environ['FLASK_ENV'] = 'production'
        os.environ['FLASK_APP'] = 'covfee.server.start:create_app'
        os.system(f'gunicorn --workers 4 -b {app.config["SERVER_SOCKET"]} \'covfee.server.start:create_app("{app.config["COVFEE_ENV"]}")\'')

    def mkuser(self, username, password):
        user = User(username, password, ['admin'])
        db.session.add(user)
        db.session.commit()
