""" Launch commands

These commands launch or build covfee and are supported for the typical use case.
"""
import os
from pathlib import Path
import subprocess
import sys
from colorama import init as colorama_init, Fore
import click
import traceback
from getpass import getpass

from flask import current_app as app
from flask.cli import FlaskGroup, pass_script_info

from covfee.server.app import create_app
from ...loader import Loader
from covfee.launcher import Launcher, ProjectExistsException
from halo.halo import Halo
from covfee.shared.validator.validation_errors import JavascriptError, ValidationError
from covfee.shared.schemata import Schemata
from covfee.cli.utils import NPMPackage, working_directory
from covfee.launcher import launch_webpack
from covfee.config import Config

colorama_init()


@click.group(name="covfee")
def covfee_cli():
    pass


@covfee_cli.command()
@click.option(
    "--host",
    default=None,
    help="Specify the IP address to serve webpack dev server. Use for testing in a local network.",
)
def webpack(host):
    """
    Launches a webpack instance for use in dev mode
    """
    config = Config("dev")

    host = (
        host if host is not None else config.get("WEBPACK_DEVSERVER_HOST", "localhost")
    )
    launch_webpack(config["COVFEE_CLIENT_PATH"], host)


@covfee_cli.command()
@click.option(
    "--port",
    default=5555,
    help="Port for the redux store service",
)
@click.option("--daemon", is_flag=True, help="Run as a daemon.")
def store(port, daemon):
    """
    Launches a webpack instance for use in dev mode
    """
    config = Config("dev")

    with working_directory(os.path.join(config["COVFEE_SERVER_PATH"], "socketio")):
        if daemon:
            res = subprocess.Popen(
                ["npx", "ts-node", "reduxStore.ts", str(port)],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.STDOUT,
                stdin=subprocess.DEVNULL,
                start_new_session=True,
            )
            print(f"Running reduxStore. PID = {res.pid}")
        else:
            res = subprocess.Popen(["npx", "ts-node", "reduxStore.ts", str(port)])
            res.wait()


@covfee_cli.command()
def build():
    """
    Builds the covfee bundle into the project folder
    """
    _, app = create_app("dev")

    with app.app_context():
        covfee_folder = Loader(os.getcwd())
        if not covfee_folder.is_project():
            raise Exception("Working directory is not a valid covfee project folder.")

        covfee_folder.build()


@covfee_cli.command()
@click.option("--dev", is_flag=True, help="Run covfee in dev mode")
@click.option("--deploy", is_flag=True, help="Run covfee in deployment mode")
@click.option("--launch-browser", is_flag=True, help="Launches the web browser.")
@click.option(
    "--safe",
    is_flag=True,
    help="Enables login protection in local and dev mode (disabled by default).",
)
def start(dev, deploy, launch_browser, safe):
    """
    Starts covfee in local mode by default. Use --deploy or --dev to start deployment (public) or development servers.
    """
    assert not (dev and deploy), "--dev and --deploy are mutually exclusive"
    mode = "local"
    if dev:
        mode = "dev"
    if deploy:
        mode = "deploy"
    unsafe = False if mode == "deploy" else (not safe)

    socketio, app = create_app(mode)

    with app.app_context():
        covfee_folder = Loader(os.getcwd())
        if not covfee_folder.is_project():
            return print(
                Fore.RED
                + "Working directory is not a valid covfee project folder. Did you run"
                " covfee maker in the current folder?"
            )

        if launch_browser:
            covfee_folder.launch_in_browser(unsafe)

        app.config["UNSAFE_MODE_ON"] = unsafe
        print(get_start_message(app.config, unsafe))
        start_covfee(socketio, app, mode)


def get_start_message(url):
    msg = (
        Fore.GREEN
        + r"""
                      __             
  ___   ___  __   __ / _|  ___   ___ 
 / __| / _ \ \ \ / /| |_  / _ \ / _ \
| (__ | (_) | \ V / |  _||  __/|  __/
 \___| \___/   \_/  |_|   \___| \___|"""
    )
    msg += f"\n\nURL: {url}\n"
    return msg


@covfee_cli.command()
@click.option("--force", is_flag=True, help="Specify to overwrite existing databases.")
@click.option("--dev", is_flag=True, help="Run in dev mode.")
@click.option("--deploy", is_flag=True, help="Run covfee in deployment mode")
@click.option("--safe", is_flag=True, help="Enable authentication in local mode.")
@click.option("--rms", is_flag=True, help="Re-makes the schemata for validation.")
@click.option(
    "--no-launch", is_flag=True, help="Do not launch covfee, only make the DB"
)
@click.argument("project_spec_file")
def make(force, dev, deploy, safe, rms, no_launch, project_spec_file):
    mode = "local"
    if dev:
        mode = "dev"
    if deploy:
        mode = "deploy"
    unsafe = False if mode == "deploy" else (not safe)
    config = Config(mode)

    install_npm_packages()

    try:
        loader = Loader(project_spec_file)
        projects = loader.process(with_spinner=True)

        launcher = Launcher(mode, projects, Path(project_spec_file).parent)
        launcher.make_database(force, with_spinner=True)
        if not no_launch:
            print(
                get_start_message(
                    url=config["ADMIN_URL"] if unsafe else config["LOGIN_URL"]
                )
            )
            launcher.launch(unsafe)
    except FileNotFoundError:
        pass
    except JavascriptError as err:
        return print(
            "This is likely an issue with the Covfee app. Please contact the developers or post an issue with the following error message. \n"
            + err.js_stack_trace
        )
    except ValidationError as err:
        return err.print_friendly()
    except ProjectExistsException as err:
        return print(
            f'Project "{err.name}" exists in database. Add --force option to overwrite all projects.'
        )
    except Exception as err:
        print(traceback.format_exc())
        if "js_stack_trace" in dir(err):
            print(err.js_stack_trace)
        return


def install_npm_packages(force=False):
    config = Config()
    server_path = config["COVFEE_SERVER_PATH"]
    npm_package = NPMPackage(server_path)
    if force or not npm_package.is_installed():
        npm_package.install()

    shared_path = config["COVFEE_SHARED_PATH"]
    npm_package = NPMPackage(shared_path)
    if force or not npm_package.is_installed():
        npm_package.install()
