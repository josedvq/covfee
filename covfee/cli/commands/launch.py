""" Launch commands

These commands launch or build covfee and are supported for the typical use case.
"""
import os
import sys
from colorama import init as colorama_init, Fore
import click
import traceback
from getpass import getpass

from flask import current_app as app
from flask.cli import FlaskGroup, pass_script_info

from covfee.server.start import create_app
from ...covfee_folder import CovfeeFolder, ProjectExistsException
from halo.halo import Halo
from covfee.shared.validator.validation_errors import JavascriptError, ValidationError
from covfee.shared.schemata import Schemata
from covfee.cli.utils import NPMPackage
from covfee.utils import covfee_make, get_start_message
from covfee.server.rtstore import rtstore

colorama_init()


@click.group(name='covfee')
def covfee_cli():
    pass

def start_covfee(socketio, app, mode='local', host='localhost'):
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

@covfee_cli.command()
@click.option("--host", default='localhost', help="Specify the IP address to serve webpack dev server. Use for testing in a local network.")
def webpack(host):
    """
    Launches a webpack instance for use in dev mode
    """
    _, app = create_app('dev')

    with app.app_context():
        covfee_folder = CovfeeFolder(os.getcwd())
        if not covfee_folder.is_project():
            return print(Fore.RED+'Working directory is not a valid covfee project folder. '
                                'Did you run covfee-maker in the current folder?')

        covfee_folder.launch_webpack(host=host)

@covfee_cli.command()
def build():
    """
    Builds the covfee bundle into the project folder
    """
    _, app = create_app('dev')

    with app.app_context():
        covfee_folder = CovfeeFolder(os.getcwd())
        if not covfee_folder.is_project():
            raise Exception(
                'Working directory is not a valid covfee project folder.')

        covfee_folder.build()


@covfee_cli.command()
@click.option("--dev", is_flag=True, help="Run covfee in dev mode")
@click.option("--deploy", is_flag=True, help="Run covfee in deployment mode")
@click.option('--launch-browser', is_flag=True, help='Launches the web browser.')
@click.option('--safe', is_flag=True, help='Enables login protection in local and dev mode (disabled by default).')
def start(dev, deploy, launch_browser, safe):
    """
    Starts covfee in local mode by default. Use --deploy or --dev to start deployment (public) or development servers.
    """
    assert not (dev and deploy), '--dev and --deploy are mutually exclusive'
    mode = 'local'
    if dev: mode = 'dev'
    if deploy: mode = 'deploy'
    unsafe = False if mode == 'deploy' else (not safe)

    socketio, app = create_app(mode)  

    with app.app_context():
        covfee_folder = CovfeeFolder(os.getcwd())
        if not covfee_folder.is_project():
            return print(Fore.RED+'Working directory is not a valid covfee project folder. Did you run'
                                ' covfee maker in the current folder?')

        if launch_browser:
            covfee_folder.launch_in_browser(unsafe)

        app.config['UNSAFE_MODE_ON'] = unsafe
        print(get_start_message(app.config, unsafe))
        start_covfee(socketio, app, mode)
        


@covfee_cli.command(name="open")
def open_covfee():
    """
    Opens covfee (admin panel) in a browser window
    """
    _, app = create_app('dev')

    with app.app_context():
        covfee_folder = CovfeeFolder(os.getcwd())
        if not covfee_folder.is_project():
            raise Exception('Working directory is not a valid covfee project folder.')
        covfee_folder.launch_in_browser()


def install_npm_packages(force=False):
    server_path = app.config['COVFEE_SERVER_PATH']
    npm_package = NPMPackage(server_path)
    if force or not npm_package.is_installed():
        npm_package.install()

    shared_path = app.config['COVFEE_SHARED_PATH']
    npm_package = NPMPackage(shared_path)
    if force or not npm_package.is_installed():
        npm_package.install()

@covfee_cli.command()
def installjs():
    _, app = create_app('local')
    with app.app_context():
        install_npm_packages(force=True)

@covfee_cli.command()
@click.option("--force", is_flag=True, help="Specify to overwrite existing databases.")
@click.option("--deploy", is_flag=True, help="Run covfee in deployment / production mode.")
@click.option("--safe", is_flag=True, help="Enable authentication in local mode.")
@click.option("--rms", is_flag=True, help="Re-makes the schemata for validation.")
@click.option("--no-launch", is_flag=True, help="Do not launch covfee, only make the DB")
@click.option("--launch-browser", is_flag=True, help="Launch in the browser")
@click.argument("file_or_folder")
def make(force, deploy, safe, rms, launch_browser, no_launch, file_or_folder):

    mode = 'deploy' if deploy else 'local'
    unsafe = False if deploy else (not safe)
    socketio, app = create_app(mode)

    with app.app_context():
        install_npm_packages()

        try:
            covfee_make(file_or_folder, force=force, rms=rms, stdout_enabled=True)
        except FileNotFoundError:
            pass
        except JavascriptError as err:
            return print('This is likely an issue with the Covfee app. Please contact the developers or post an issue with the following error message. \n' + err.js_stack_trace)
        except ValidationError as err:
            return err.print_friendly()
        except ProjectExistsException as err:
            return print('Project exists in covfee. Add --force option to overwrite.')
        except Exception as err:
            print(traceback.format_exc())
            if 'js_stack_trace' in dir(err):
                print(err.js_stack_trace)
            return

        if no_launch: 
            return

        if launch_browser:
            project_folder = CovfeeFolder(os.getcwd())
            project_folder.launch_in_browser(unsafe)

        app.config['UNSAFE_MODE_ON'] = unsafe
        print(get_start_message(app.config, unsafe))
        start_covfee(socketio, app, 'local')

@covfee_cli.command()
def mkuser():
    """
    Creates an admin in the database.
    """
    _, app = create_app('dev')

    with app.app_context():
        project_folder = CovfeeFolder(os.getcwd())
        if not project_folder.is_project():
            project_folder.init()

        username = input('Please enter username: ')
        password = getpass()
        project_folder.mkuser(username, password)
