import os
import shutil
import json

from halo import Halo
from covfee.server.orm import app, db


def cli_create_tables():
    '''
    Creates all the tables defined in the ORM
    '''
    with Halo(text='Creating tables', spinner='dots') as spinner:
        db.create_all()
        spinner.succeed('Created database tables.')


class ProjectFolder:

    def __init__(self, path):
        self.path = path

    def is_project(self):
        return os.path.exists(app.config['DATABASE_PATH'])

    def clear(self):
        shutil.rmtree(os.path.join(self.path, '.covfee'))

    def init(self):
        os.makedirs(os.path.join(self.path, '.covfee/www'))
        cli_create_tables()

    def init_frontend(self):
        # create a JSON file with constants for the front-end
        app_constants = {
            'env': app.config['COVFEE_ENV'],
            'app_url': app.config['APP_URL'],
            'admin_url': app.config['ADMIN_URL'],
            'api_url': app.config['API_URL'],
            'auth_url': app.config['AUTH_URL'],
            'media_url': app.config['MEDIA_URL']
        }
        constants_path = os.path.join(os.getcwd(), '.covfee/covfee_constants.json')
        json.dump(app_constants, open(constants_path, 'w'), indent=2)

        # TODO: remove all of this once webpack 5 is supported by storybook
        custom_tasks_path = os.path.join(self.path, 'covfee_tasks')

        if not os.path.exists(custom_tasks_path):
            os.mkdir(custom_tasks_path)

        # create a javascript custom tasks module if it does not exist
        fpaths = [os.path.join(custom_tasks_path, fname)
                for fname in ['index.js', 'index.jsx', 'index.ts', 'index.tsx']]

        fpaths_exist = [os.path.exists(fpath) for fpath in fpaths]
        if not any(fpaths_exist):
            with open(fpaths[0], 'w') as fh:
                fh.write('export {}')
