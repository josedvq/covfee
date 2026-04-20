"""Launch commands for preparing and running a covfee backend."""

import traceback
from pathlib import Path

import click
from colorama import Fore
from colorama import init as colorama_init

from covfee.cli.utils import working_directory
from covfee.config import Config
from covfee.launcher import Launcher, ProjectExistsException
from covfee.server.tasks.base import BaseCovfeeTask
from covfee.shared.validator.validation_errors import JavascriptError, ValidationError

from ...loader import Loader

colorama_init()


def resolve_mode(dev: bool, deploy: bool) -> str:
    """Return the selected runtime mode."""
    if dev and deploy:
        raise click.ClickException("Choose either --dev or --deploy, not both.")
    return "deploy" if deploy else "dev"


def resolve_project_spec_path(project_path: Path) -> Path:
    """Resolve a project directory to its hard-coded app.py entrypoint."""
    if project_path.is_dir():
        return project_path / "app.py"
    return project_path


def resolve_project_root(project_path: Path) -> Path:
    """Return the project root directory for a given project input."""
    return project_path if project_path.is_dir() else project_path.parent


def get_start_message(url: str) -> str:
    """Return the terminal banner shown before launching the backend."""
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


def build_config(mode: str, host: str, port: int) -> Config:
    """Create the runtime config for a specific project directory."""
    config = Config(mode, host, port)
    BaseCovfeeTask.config = config
    return config


def make_project(
    project_path: Path,
    mode: str,
    force: bool,
    host: str,
    port: int,
    no_launch: bool,
    auth_enabled: bool,
) -> None:
    """Initialize a project and optionally launch the backend."""
    project_root = resolve_project_root(project_path)
    with working_directory(project_root):
        config = build_config(mode, host, port)
        loader = Loader(project_path, config)
        projects = loader.process(with_spinner=True)
        launcher = Launcher(
            mode,
            projects,
            project_root,
            config=config,
            auth_enabled=auth_enabled,
        )
        launcher.make_database(force, with_spinner=True)
        if not no_launch:
            unsafe = not auth_enabled
            print(
                get_start_message(
                    url=config["ADMIN_URL"] if unsafe else config["LOGIN_URL"]
                )
            )
            launcher.launch(host=host, port=port)


def start_backend(
    project_path: Path,
    mode: str,
    host: str,
    port: int,
    auth_enabled: bool,
) -> None:
    """Start only the backend for an existing project."""
    project_root = resolve_project_root(project_path)
    with working_directory(project_root):
        config = build_config(mode, host, port)
        launcher = Launcher(
            mode,
            [],
            project_root,
            config=config,
            auth_enabled=auth_enabled,
        )
        launcher.launch(host=host, port=port)


@click.group(name="covfee")
def covfee_cli():
    pass


@covfee_cli.command()
@click.option("--force", is_flag=True, help="Specify to overwrite existing databases.")
@click.option("--dev", is_flag=True, help="Run in development mode.")
@click.option("--deploy", is_flag=True, help="Run in deployment mode.")
@click.option("--safe", is_flag=True, help="Enable authentication in development mode.")
@click.option(
    "--host",
    default="localhost",
    help="Public host to use for generated URLs.",
)
@click.option(
    "--port",
    default=5001,
    help="Public port to use for generated URLs.",
)
@click.option(
    "--no-launch", is_flag=True, help="Do not launch covfee, only make the DB."
)
@click.argument(
    "project_path",
    required=False,
    default=".",
    type=click.Path(exists=True, file_okay=True, dir_okay=True, path_type=Path),
)
def make(force, dev, deploy, safe, host, port, no_launch, project_path):
    mode = resolve_mode(dev, deploy)
    auth_enabled = mode == "deploy" or safe

    try:
        make_project(project_path, mode, force, host, port, no_launch, auth_enabled)
    except FileNotFoundError:
        missing_path = resolve_project_spec_path(project_path)
        return print(f"File {missing_path} not found.")
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
@click.option("--host", default="0.0.0.0", help="Backend hostname.")
@click.option("--port", default=5000, help="Backend port.")
@click.option("--dev", is_flag=True, help="Run in development mode.")
@click.option("--deploy", is_flag=True, help="Run in deployment mode.")
@click.option("--safe", is_flag=True, help="Enable authentication in development mode.")
@click.argument(
    "project_path",
    required=False,
    default=".",
    type=click.Path(exists=True, file_okay=True, dir_okay=True, path_type=Path),
)
def start(host, port, dev, deploy, safe, project_path):
    """Start only the backend service for a project."""
    mode = resolve_mode(dev, deploy)
    auth_enabled = mode == "deploy" or safe

    try:
        start_backend(project_path, mode, host, port, auth_enabled)
    except Exception as err:
        print(traceback.format_exc())
        if "js_stack_trace" in dir(err):
            print(err.js_stack_trace)
        return
