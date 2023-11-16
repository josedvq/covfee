""" Launch commands

These commands launch or build covfee and are supported for the typical use case.
"""
import os
from pathlib import Path
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
from covfee.cli.utils import NPMPackage
from covfee.launcher import launch_webpack
from covfee.config import Config

colorama_init()


@click.group(name="covfee")
def covfee_cli():
    pass


def start_covfee(socketio, app, mode="local", host="localhost"):
    if app.config["SSL_ENABLED"]:
        ssl_options = {
            "keyfile": app.config["SSL_KEY_FILE"],
            "certfile": app.config["SSL_CERT_FILE"],
        }
    else:
        ssl_options = {}

    if mode == "local":
        socketio.run(app, host=host, port=5000, **ssl_options)
    elif mode == "dev":
        socketio.run(app, host=host, port=5000, debug=True, **ssl_options)
    elif mode == "deploy":
        socketio.run(app, host=host, **ssl_options)
    else:
        raise f"unrecognized mode {mode}"


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


def covfee_make(file_or_folder, force=False, rms=False, stdout_enabled=True):
    project_folder = Loader(os.getcwd())

    # add the covfee files to the project
    with Halo(
        text="Adding .covfee.json files", spinner="dots", enabled=stdout_enabled
    ) as spinner:
        covfee_files = project_folder.add_covfee_files(file_or_folder)

        if len(covfee_files) == 0:
            err = f"No valid covfee files found. Make sure that {file_or_folder} points to a file or to a folder containing .covfee.json files."
            spinner.fail(err)
            raise FileNotFoundError(err)

        spinner.succeed(f"{len(covfee_files)} covfee project files found.")


def get_start_message(config, unsafe):
    url = config["ADMIN_URL"] if unsafe else config["LOGIN_URL"]
    msg = r"""
                      __             
  ___   ___  __   __ / _|  ___   ___ 
 / __| / _ \ \ \ / /| |_  / _ \ / _ \
| (__ | (_) | \ V / |  _||  __/|  __/
 \___| \___/   \_/  |_|   \___| \___|"""
    msg += f"\nURL: {url}"
    return msg


@covfee_cli.command()
@click.option("--force", is_flag=True, help="Specify to overwrite existing databases.")
@click.option("--dev", is_flag=True, help="Run in dev mode.")
@click.option("--safe", is_flag=True, help="Enable authentication in local mode.")
@click.option("--rms", is_flag=True, help="Re-makes the schemata for validation.")
@click.option(
    "--no-launch", is_flag=True, help="Do not launch covfee, only make the DB"
)
@click.argument("project_spec_file")
def make(force, deploy, safe, rms, launch_browser, no_launch, project_spec_file):
    # mode = "deploy" if deploy else "local"
    unsafe = False if deploy else (not safe)

    install_npm_packages()

    try:
        loader = Loader(project_spec_file)
        projects = loader.process(with_spinner=True)

        launcher = Launcher(Path(project_spec_file).parent, projects)

        # init project folder if necessary
        if not loader.is_project():
            loader.init()
        loader.push(force=force, with_spinner=True)

        # link bundles
        with Halo(text="Linking covfee bundles", spinner="dots") as spinner:
            try:
                launcher.link_bundles()
            except Exception as e:
                spinner.fail("Error linking bundles. Aborted.")
                raise e
            spinner.succeed("covfee bundles linked.")
        # covfee_make(file_or_folder, force=force, rms=rms, stdout_enabled=True)
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
        return print("Project exists in covfee. Add --force option to overwrite.")
    except Exception as err:
        print(traceback.format_exc())
        if "js_stack_trace" in dir(err):
            print(err.js_stack_trace)
        return

    if no_launch:
        return

    app.config["UNSAFE_MODE_ON"] = unsafe
    print(get_start_message(app.config, unsafe))
    start_covfee(socketio, app, "local")


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
