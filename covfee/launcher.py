import os
import sys
import json
from shutil import which
from typing import Any

from halo.halo import Halo
from colorama import init as colorama_init, Fore

from covfee.shared.validator.ajv_validator import AjvValidator
from covfee.server.app import create_app
# from .covfee_folder import CovfeeFolder
from covfee.cli.utils import working_directory

class Launcher():

    spec: Any

    def __init__(self, spec):
        self.spec = spec

    def launch(self, mode='local', no_browser=False, safe=False):
        """
        Starts covfee in local mode by default. 
        Use deploy or dev to start deployment (public) or development servers.
        """
        unsafe = False if mode == 'deploy' else (not safe)

        socketio, app = create_app(mode)  

        with app.app_context():
            covfee_folder = CovfeeFolder(os.getcwd())
            if not covfee_folder.is_project():
                return print(Fore.RED+'Working directory is not a valid covfee project folder. Did you run'
                                    ' covfee maker in the current folder?')

            if not no_browser:
                self.launch_browser(unsafe)

            app.config['UNSAFE_MODE_ON'] = unsafe
            self._start_server(socketio, app, mode)

    def _start_server(self, socketio, app, mode='local', host='localhost'):
        if app.config['SSL_ENABLED']:
            ssl_options = {
                
                'keyfile': app.config['SSL_KEY_FILE'],
                'certfile': app.config['SSL_CERT_FILE']
            }
        else:
            ssl_options = {}

        app.spec = self.spec
        if mode == 'local':
            socketio.run(app, host=host, port=5000, **ssl_options)
        elif mode == 'dev':
            socketio.run(app, host=host, port=5000, debug=True, **ssl_options)
        elif mode == 'deploy':
            socketio.run(app, host=host, **ssl_options)
        else:
            raise f'unrecognized mode {mode}'

    def launch_webpack(self, host=None):
        cwd = os.getcwd()
        # run the dev server
        with working_directory(app.config['COVFEE_CLIENT_PATH']):
            os.system('npx webpack serve' +
                      ' --env COVFEE_WD=' + cwd +
                      ' --config ./webpack.dev.js' +
                      ('' if host is None else ' --host ' + host))


    def launch_browser(self, unsafe=False):
        target_url = app.config["ADMIN_URL"] if unsafe else app.config["LOGIN_URL"]
        if which('xdg-open') is not None:
            os.system(f'xdg-open {target_url}')
        elif sys.platform == 'darwin' and which('open') is not None:
            os.system(f'open {target_url}')
        else:
            print(Fore.GREEN +
                  f' * covfee is available at {target_url}')

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
                spinner.succeed(f'Read covfee file {cf}.')

            with Halo(text=f'Validating project {project_spec["name"]} in {cf}',
                      spinner='dots',
                      enabled=with_spinner) as spinner:

                try:
                    self.validate_project(project_spec, cf, with_spinner=with_spinner)
                except Exception as e:
                    spinner.fail(f'Error validating project \"{project_spec["name"]}\" in {cf}.\n')
                    raise e
                self.projects.append((project_spec, cf))
                spinner.succeed(f'Project \"{project_spec["name"]}\" in {cf} is valid.')

    # def push_projects(self, force=False, with_spinner=False):
    #     for project_spec, cf in self.projects:
    #         # delete existing project with the same id
    #         with Halo(text=f'Looking for existing projects with id {project_spec["id"]}',
    #                   spinner='dots',
    #                   enabled=False) as spinner:

    #             projid = Project.get_id(project_spec['id'])
    #             existing_project = Project.query.filter_by(id=projid).first()
    #             if existing_project is not None:
    #                 if force:
    #                     db.session.delete(existing_project)
    #                     db.session.commit()
    #                     spinner.warn(
    #                         f'Deleted existing project with conflicting ID {project_spec["id"]}')
        
    #                 else:
    #                     msg = f'Project with ID {project_spec["id"]} already exists.'
    #                     spinner.fail(msg)
    #                     raise ProjectExistsException(msg)

    #         # making
    #         with Halo(text=f'Making project {project_spec["name"]} from file {cf}',
    #                   spinner='dots',
    #                   enabled=False) as spinner:
    #             project = Project(**project_spec)
    #             db.session.add(project)
    #             spinner.succeed(
    #                 f'Project {project_spec["name"]} created successfully from file {cf}')
    #     db.session.commit()