"""Launch commands

These commands launch or build covfee and are supported for the typical use case.
"""

import os
import subprocess
import traceback
from pathlib import Path

import click
from colorama import Fore
from colorama import init as colorama_init

from covfee.cli.utils import NPMPackage, working_directory
from covfee.config import Config
from covfee.launcher import Launcher, ProjectExistsException, launch_webpack
from covfee.shared.validator.validation_errors import (JavascriptError,
                                                       ValidationError)

from ...loader import Loader

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
    "--host",
    default='localhost',
    help="Host to pass to socketio.run()",
)
@click.option(
    "--port",
    default=5001,
    help="Port to pass to socketio.run()",
)
@click.option(
    "--no-launch", is_flag=True, help="Do not launch covfee, only make the DB"
)
@click.argument("project_spec_file")
def make(force, dev, deploy, safe, rms, host, port, no_launch, project_spec_file):
    mode = "local"
    if dev:
        mode = "dev"
    if deploy:
        mode = "deploy"
    unsafe = False if mode == "deploy" else (not safe)
    config = Config(mode, host, port)

    install_npm_packages()

    try:
        loader = Loader(project_spec_file)
        projects = loader.process(with_spinner=True)

        launcher = Launcher(
            mode, projects, Path(project_spec_file).parent, auth_enabled=not unsafe
        )
        launcher.make_database(force, with_spinner=True)
        if not no_launch:
            print(
                get_start_message(
                    url=config["ADMIN_URL"] if unsafe else config["LOGIN_URL"]
                )
            )
            launcher.launch(host=host, port=port)
    except FileNotFoundError:
        return print(f"File {project_spec_file} not found.")
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


@covfee_cli.command()
@click.option("--host", default="0.0.0.0", help="Server hostname.")
@click.option("--port", default=5000, help="Port to serve the app on.")
@click.option("--deploy", is_flag=True, help="Run covfee in deployment mode")
@click.option("--safe", is_flag=True, help="Enable authentication in local mode.")
def start(host, port, deploy, safe):
    """
    Starts covfee in local mode by default. Use --deploy to start deployment server.
    """
    mode = "local"
    if deploy:
        mode = "deploy"
    unsafe = False if mode == "deploy" else (not safe)
    config = Config(mode)

    try:
        launcher = Launcher(mode, [], auth_enabled=not unsafe)
        launcher.launch(host=host, port=port)
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
