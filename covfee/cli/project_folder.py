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
        covfee_hidden = os.path.join(self.path, '.covfee')
        if not os.path.exists(covfee_hidden):
            os.makedirs(covfee_hidden)
        media_path = os.path.join(self.path, 'www', 'media')
        if not os.path.exists(media_path):
            os.makedirs(media_path)
        cli_create_tables()

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
