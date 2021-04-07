""" Launch commands

These commands meant as development tools only
"""
import os
import click

from flask import current_app as app
from flask.cli import FlaskGroup

from covfee.server.start import create_app
from covfee.cli.utils import working_directory


@click.group(cls=FlaskGroup, create_app=create_app, name='covfee-dev')
def covfee_dev_cli():
    pass


@covfee_dev_cli.command()
def build_master():
    """
    Builds the master (without custom tasks) for distribution.
    """
    bundle_path = app.config['MASTER_BUNDLE_PATH']
    with working_directory(app.config['COVFEE_CLIENT_PATH']):
        os.system('npx webpack' +
                  ' --config ./webpack.prod.js' + ' --output-path '+bundle_path)
