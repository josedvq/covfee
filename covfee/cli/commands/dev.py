"""Development workflow commands for the split runtime."""

import os
import subprocess
from pathlib import Path
from shutil import which

import click
from halo.halo import Halo

from covfee.cli.utils import working_directory
from covfee.config import Config, config
from covfee.shared.schemata import Schemata


@click.group(name="covfee-dev")
def covfee_dev_cli():
    pass


@covfee_dev_cli.command(name="build")
def build_master():
    """
    Builds the master (without custom tasks) for distribution.
    """
    config.load_environment("dev")
    bundle_path = config["MASTER_BUNDLE_PATH"]
    with working_directory(config["COVFEE_CLIENT_PATH"]):
        os.system(
            "npx webpack"
            + " --config ./webpack.prod.js"
            + " --output-path "
            + bundle_path
        )


@covfee_dev_cli.command(name="schemata")
def make_schemata():
    with Halo(text="Making schemata", spinner="dots") as spinner:
        schema = Schemata()
        schema.make()
        schema.make_dataclasses()
        spinner.succeed("Schemata made.")

def get_repo_root() -> Path:
    """Return the root of the main covfee repository."""
    return Path(Config()["COVFEE_BASE_PATH"]).resolve().parent


def get_dev_env_path(repo_root: Path) -> Path:
    """Return the shared dev env file for the current invocation."""
    return repo_root / "dev" / "dev.env"


@covfee_dev_cli.command(name="run")
@click.argument(
    "project_dir",
    required=False,
    type=click.Path(exists=True, file_okay=False, dir_okay=True, path_type=Path),
)
def run_dev(project_dir: Path | None):
    """Launch the Procfile-based development environment."""
    if which("honcho") is None:
        raise click.ClickException(
            "The `honcho` command is required. Run dev/dev-setup.sh first."
        )

    repo_root = get_repo_root()
    current_dir = Path.cwd().resolve()
    env_path = get_dev_env_path(repo_root)
    env = os.environ.copy()
    env["PROJECT_DIR"] = str(
        project_dir.resolve() if project_dir is not None else current_dir
    )
    argv = [
        "honcho",
        "start",
        "-f",
        str(repo_root / "dev" / "Procfile"),
        "-e",
        str(env_path),
    ]
    os.chdir(repo_root)
    try:
        os.execvpe("honcho", argv, env)
    except OSError as exc:
        raise click.ClickException(f"Failed to exec honcho: {exc}") from exc


@covfee_dev_cli.command(name="store")
@click.option("--watch/--no-watch", default=True, help="Restart the store on file changes.")
def store(watch: bool):
    """Start the Node Redux store service."""
    repo_root = get_repo_root()
    base_config = Config()
    port = os.environ.get(
        "COVFEE_REDUX_STORE_PORT", str(base_config["REDUX_STORE_PORT"])
    )
    with working_directory(repo_root / "store"):
        command = ["npx", "ts-node", "reduxStore.ts", port]
        if watch:
            command = [
                "npx",
                "nodemon",
                "--watch",
                "reduxStore.ts",
                "--watch",
                "types.ts",
                "--watch",
                "../covfee/client/tasks",
                "--ext",
                "ts,tsx,js",
                "--exec",
                " ".join(command),
            ]
        proc = subprocess.run(command, check=False)
        raise SystemExit(proc.returncode)
