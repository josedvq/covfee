import os
import shutil

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
        return os.path.exists(os.path.join(self.path, app.config['DATABASE_RELPATH']))

    def clear(self):
        shutil.rmtree(os.path.join(self.path, '.covfee'))

    def init(self):
        os.makedirs(os.path.join(self.path, '.covfee/www'))
        cli_create_tables()
