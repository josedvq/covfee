import os
import sys
import json
from shutil import which
from typing import Any, List

from halo.halo import Halo
from colorama import init as colorama_init, Fore

from covfee.server.db import SessionLocal, engine
from covfee.config import get_config
import covfee.server.orm as orm
from covfee.shared.validator.ajv_validator import AjvValidator
from covfee.server.app import create_app
from covfee.cli.utils import working_directory


class ProjectExistsException(Exception):
    pass

class Launcher():
    '''
    Takes care of:
    1) validating projects
    2) commiting projects to DB (optional)
    3) launching covfee in 'local' or 'dev' mode
    '''

    # holds valid projects
    projects: List['orm.Project']

    def __init__(self, projects: List['orm.Project'] = []):
        self.projects = projects

    def start(self, mode='local'):
        
        orm.Base.metadata.create_all(engine)
        self.check_conficts()
        self.commit()
        self.launch('dev')

    def launch(self, mode='local', no_browser=False):
        """
        Starts covfee in local mode by default. 
        Use deploy or dev to start deployment (public) or development servers.
        """
        socketio, app = create_app(mode)  
        with app.app_context():
            # covfee_folder = CovfeeFolder(os.getcwd())
            # if not covfee_folder.is_project():
            #     return print(Fore.RED+'Working directory is not a valid covfee project folder. Did you run'
            #                         ' covfee maker in the current folder?')

            # if not no_browser:
            #     self.launch_browser(unsafe)

            app.config['UNSAFE_MODE_ON'] = True
            self._start_server(socketio, app, mode)

    def _start_server(self, socketio, app, mode='local', host='localhost'):
        if app.config['SSL_ENABLED']:
            ssl_options = {
                
                'keyfile': app.config['SSL_KEY_FILE'],
                'certfile': app.config['SSL_CERT_FILE']
            }
        else:
            ssl_options = {}

        if mode == 'local':
            socketio.run(app, host=host, port=5000, **ssl_options)
        elif mode == 'dev':
            socketio.run(app, host=host, port=5000, debug=True, **ssl_options)
        elif mode == 'deploy':
            socketio.run(app, host=host, **ssl_options)
        else:
            raise f'unrecognized mode {mode}'
        
        # from covfee.server.socketio.redux_store import ReduxStoreService
        # redux_store = ReduxStoreService()
        # redux_store.run()


    def launch_browser(self, unsafe=False):
        config = get_config('local')
        target_url = config["ADMIN_URL"] if unsafe else config["LOGIN_URL"]
        if which('xdg-open') is not None:
            os.system(f'xdg-open {target_url}')
        elif sys.platform == 'darwin' and which('open') is not None:
            os.system(f'open {target_url}')
        else:
            print(Fore.GREEN +
                  f' * covfee is available at {target_url}')

    def check_conficts(self, force=False, with_spinner=False):
        with SessionLocal() as session:
            for project in self.projects:
                # delete existing project with the same id
                with Halo(text=f'Looking for existing projects with id {project.name}',
                        spinner='dots',
                        enabled=False) as spinner:

                    orm.Project.session = session
                    existing_project = orm.Project.from_name(project.name)
                    project._conflicts = (existing_project is not None)
                    if existing_project:
                        return False
            return True
                    
    def commit(self, force=False, with_spinner=False):
        
        with SessionLocal() as session:
            for project in self.projects:
                if project._conflicts:
                    # there is a project with same id
                    if force:
                        orm.Project.session = session
                        existing_project = orm.Project.from_name(project.name)
                        session.delete(existing_project)
                        session.commit()
                        # spinner.warn(f'Deleted existing project with conflicting ID {project["id"]}')
                    else:
                        msg = f'Project with ID {project["id"]} already exists.'
                        raise Exception(msg)
                        # spinner.fail(msg)
                        # raise ProjectExistsException(msg)
                # with Halo(text=f'Making project {project["name"]}',
                #         spinner='dots',
                #         enabled=False) as spinner:
                session.add(project)
                # spinner.succeed(
                #     f'Project {project["name"]} created successfully from file {cf}')
            session.commit()

def launch_webpack(covfee_client_path, host=None):
    # run the dev server
    with working_directory(covfee_client_path):
        os.system('npx webpack serve' +
                    ' --config ./webpack.dev.js' +
                    ('' if host is None else ' --host ' + host))