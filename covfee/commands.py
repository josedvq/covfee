import os
import sys
import json
from shutil import which
from colorama import init, Fore

import click
from covfee.server.orm import app
from .cli.utils import working_directory


def prepare():
    custom_tasks_path = os.path.join(os.getcwd(), 'covfee_tasks')

    if not os.path.exists(custom_tasks_path):
        os.mkdir(custom_tasks_path)

    # create a JSON file with constants for the front-end
    app_constants = {
        'env': app.config['COVFEE_ENV'],
        'app_url': app.config['APP_URL'],
        'admin_url': app.config['ADMIN_URL'],
        'api_url': app.config['API_URL'],
        'auth_url': app.config['AUTH_URL'],
        'media_url': app.config['MEDIA_URL']
    }
    constants_path = os.path.join(os.getcwd(), 'covfee_constants.json')
    json.dump(app_constants, open(constants_path, 'w'), indent=2)

    # create a javascript custom tasks module if it does not exist
    fpaths = [os.path.join(custom_tasks_path, fname)
              for fname in ['index.js', 'index.jsx', 'index.ts', 'index.tsx']]

    fpaths_exist = [os.path.exists(fpath) for fpath in fpaths]
    if not any(fpaths_exist):
        with open(fpaths[0], 'w') as fh:
            fh.write('export {}')


def start_webpack():
    prepare()

    cwd = os.getcwd()

    # run the dev server
    covfee_path = os.path.join(os.path.dirname(os.path.realpath(__file__)))

    with working_directory(covfee_path):
        os.system(os.path.join('node_modules', '.bin', 'webpack-dev-server') +
        ' --env.COVFEE_WD=' + cwd +
        ' --config ./client/webpack.dev.js')


@click.command()
def cmd_start_webpack():
    start_webpack()


def start_dev(unsafe):
    if unsafe:
        os.environ['UNSAFE_MODE_ON'] = 'enable'
    os.environ['FLASK_ENV'] = 'development'
    os.environ['FLASK_APP'] = 'covfee.server.start:create_app'
    os.system(sys.executable + ' -m flask run')


@click.command()
@click.option('--unsafe', is_flag=True, help='Disables authentication.')
def cmd_start_dev(unsafe):
    start_dev(unsafe)


def start_prod(unsafe):
    if unsafe:
        os.environ['UNSAFE_MODE_ON'] = 'enable'
    os.environ['FLASK_ENV'] = 'production'
    os.environ['FLASK_APP'] = 'covfee.server.start:create_app'
    os.system(sys.executable + ' -m flask run')


@click.command()
def cmd_start_prod():
    start_prod()


def build():
    prepare()

    cwd = os.getcwd()

    bundle_path = app.config['PROJECT_WWW_PATH']
    covfee_path = os.path.dirname(os.path.realpath(__file__))

    with working_directory(covfee_path):
        os.system(os.path.join('node_modules', '.bin', 'webpack') +
                ' --env.COVFEE_WD=' + cwd +
                ' --config ./client/webpack.dev.js' + ' --output-path '+bundle_path)


@click.command()
def cmd_build():
    build()


def set_env(env: str):
    env_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'covfee.env.json')
    json.dump({'FLASK_ENV': env}, open(env_path, 'w'), indent=2)


@click.command()
def set_env_dev():
    return set_env('development')


@click.command()
def set_env_prod():
    return set_env('production')


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
