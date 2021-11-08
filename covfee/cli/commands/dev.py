""" Launch commands

These commands meant as development tools only
"""
import os
import click

from flask import current_app as app
from halo.halo import Halo

from covfee.server.start import create_app
from covfee.cli.utils import working_directory
from covfee.shared.schemata import Schemata

@click.group(name='covfee-dev')
def covfee_dev_cli():
    pass


@covfee_dev_cli.command(name='build')
def build_master():
    """
    Builds the master (without custom tasks) for distribution.
    """
    _, app = create_app('dev')

    with app.app_context():
        bundle_path = app.config['MASTER_BUNDLE_PATH']
        with working_directory(app.config['COVFEE_CLIENT_PATH']):
            os.system('npx webpack' +
                    ' --config ./webpack.prod.js' + ' --output-path '+bundle_path)

@covfee_dev_cli.command(name='schemata')
def make_schemata():
    _, app = create_app('dev')

    with app.app_context():
        with Halo(text='Making schemata', spinner='dots') as spinner:
            schema = Schemata()
            schema.make()
            spinner.succeed('Schemata made.')
