import os
import sys
import json
from shutil import which
from colorama import init, Fore
from halo import Halo

import click
from covfee.server.orm import app
from .cli.utils import working_directory
from .cli.project_folder import ProjectFolder



@click.command()
def cmd_start_webpack():
    folder = ProjectFolder(os.getcwd())
    if not folder.is_project():
        return print(Fore.RED+'Working directory is not a valid covfee project folder. Did you run covfee-maker in the current folder?')

    folder.init_frontend()

    cwd = os.getcwd()
    # run the dev server
    covfee_path = os.path.join(os.path.dirname(os.path.realpath(__file__)))
    with working_directory(covfee_path):
        os.system(os.path.join('node_modules', '.bin', 'webpack-dev-server') +
        ' --env.COVFEE_WD=' + cwd +
        ' --config ./client/webpack.dev.js')


def start_dev():
    os.environ['UNSAFE_MODE_ON'] = 'enable'
    os.environ['FLASK_ENV'] = 'development'
    os.environ['FLASK_APP'] = 'covfee.server.start:create_app'
    os.system(sys.executable + ' -m flask run')


@click.command()
def cmd_start_dev():
    start_dev()


def start_prod(unsafe):
    folder = ProjectFolder(os.getcwd())
    if not folder.is_project():
        raise Exception('Working directory is not a valid covfee project folder.')
    if unsafe:
        os.environ['UNSAFE_MODE_ON'] = 'enable'
    os.environ['FLASK_ENV'] = 'production'
    os.environ['FLASK_APP'] = 'covfee.server.start:create_app'
    os.system(f'gunicorn -b {app.config["SERVER_SOCKET"]} \'covfee.server.start:create_app()\'')


@click.command()
@click.option('--unsafe', is_flag=True, help='Disables authentication.')
@click.option('--no-launch', is_flag=True, help='Disables launching of the web browser.')
def cmd_start_prod(unsafe, no_launch):
    folder = ProjectFolder(os.getcwd())
    if not folder.is_project():
        return print(Fore.RED+'Working directory is not a valid covfee project folder. Did you run covfee-maker in the current folder?')

    if not no_launch:
        open_covfee_admin()

    start_prod(unsafe)


def build():
    folder = ProjectFolder(os.getcwd())
    if not folder.is_project():
        raise Exception('Working directory is not a valid covfee project folder.')

    folder.init_frontend()

    cwd = os.getcwd()

    bundle_path = app.config['PROJECT_WWW_PATH']
    covfee_path = os.path.dirname(os.path.realpath(__file__))

    with working_directory(covfee_path):
        os.system(os.path.join('node_modules', '.bin', 'webpack') +
                ' --env.COVFEE_WD=' + cwd +
                ' --config ./client/webpack.prod.js' + ' --output-path '+bundle_path)


@click.command()
def cmd_build():
    build()


def install_js():
    fpath = os.path.dirname(os.path.realpath(__file__))
    with working_directory(fpath):
        os.system('npm install')


@click.command()
def cmd_install_js():
    install_js()


def open_covfee_admin():
    if which('xdg-open') is not None:
        os.system(f'xdg-open {app.config["ADMIN_URL"]}')
    elif sys.platform == 'darwin' and which('open') is not None:
        os.system(f'open {app.config["ADMIN_URL"]}')
    else:
        print(f'covfee is available at {app.config["ADMIN_URL"]}')


@click.command()
def cmd_open():
    open_covfee_admin()
