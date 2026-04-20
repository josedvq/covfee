import os
import sys
from pathlib import Path as FilePath
from shutil import which
from typing import List

from click import Path
from colorama import Fore
from halo.halo import Halo

from covfee.cli.utils import working_directory
from covfee.config import Config
from covfee.server.app import create_app_and_socketio
from covfee.server.db import get_engine, get_session_local

from .server.orm import Base, Project, User


class ProjectExistsException(Exception):
    def __init__(self, name):
        super().__init__("Conflicting project found in database")
        self.name = name


class Launcher:
    """
    Takes care of:
    1) validating projects
    2) commiting projects to DB (optional)
    3) launching covfee in 'dev' or 'deploy' mode
    """

    # holds valid projects
    projects: List["Project"]

    def __init__(
        self,
        environment,
        projects: List["Project"] | None = None,
        folder: Path = None,
        config: Config | None = None,
        auth_enabled: bool = True,
    ):
        self.environment = environment
        self.config = config or Config(environment)

        self.projects = projects or []
        self.folder = folder
        self.auth_enabled = auth_enabled

        self.engine = get_engine(in_memory=False, db_path=self.config["DATABASE_PATH"])
        self.session_local = get_session_local(self.engine)

    def make_database(self, force=False, with_spinner=False):
        self.init_folder()
        self.create_tables(drop=force)
        self.create_admin()
        if not force:
            with Halo(
                text="Looking for existing projects",
                spinner="dots",
                enabled=with_spinner,
            ) as spinner:
                try:
                    self.check_conficts()
                except ProjectExistsException as ex:
                    spinner.fail("Conflicts found")
                    raise ex

        self.commit()

    def launch(self, host="0.0.0.0", port=5000):
        socketio, app = create_app_and_socketio(
            self.environment,
            self.session_local,
            config=self.config,
        )
        with app.app_context():
            app.config["UNSAFE_MODE_ON"] = not self.auth_enabled
            self._start_server(socketio, app, host, port)

    def create_tables(self, drop=False):
        if drop:
            Base.metadata.drop_all(self.engine)
        Base.metadata.create_all(self.engine)

    def create_admin(self):
        default_username = self.config["DEFAULT_ADMIN_USERNAME"]
        default_password = self.config["DEFAULT_ADMIN_PASSWORD"]
        if "ADMIN_USERNAME" in self.config and "ADMIN_PASSWORD" in self.config:
            username = self.config["ADMIN_USERNAME"]
            password = self.config["ADMIN_PASSWORD"]

            if (
                self.auth_enabled
                and username == default_username
                and password == default_password
            ):
                raise ValueError(
                    'Default admin credentials "admin:admin" have not been changed. Please change username and password in config when deploying with authentication.'
                )
            with self.session_local() as session:
                user = User.by_username(session, username)
                if user is not None:
                    return
                admin = User.from_username_password(
                    username=username,
                    password=password,
                    secret=self.config["JWT_SECRET_KEY"],
                )
                session.add(admin)
                session.commit()

    def _start_server(self, socketio, app, host="0.0.0.0", port=5000):
        if app.config["SSL_ENABLED"]:
            ssl_options = {
                "keyfile": self.config["SSL_KEY_FILE"],
                "certfile": self.config["SSL_CERT_FILE"],
            }
        else:
            ssl_options = {}

        print(f"Running covfee at {host}:{port} with environment={self.environment}")
        if self.environment not in {"dev", "deploy"}:
            raise f"unrecognized self.environment {self.environment}"
        socketio.run(
            app,
            host=host,
            port=port,
            debug=self.environment == "dev",
            use_reloader=self.environment == "dev",
            **ssl_options,
        )

    def launch_browser(self, unsafe=False):
        target_url = self.config["ADMIN_URL"] if unsafe else self.config["LOGIN_URL"]
        if which("xdg-open") is not None:
            os.system(f"xdg-open {target_url}")
        elif sys.platform == "darwin" and which("open") is not None:
            os.system(f"open {target_url}")
        else:
            print(Fore.GREEN + f" * covfee is available at {target_url}")

    def check_conficts(self, with_spinner=False):
        with self.session_local() as session:
            for project in self.projects:
                existing_project = Project.by_name(session, project.name)
                if existing_project:
                    raise ProjectExistsException(project.name)

    def commit(self):
        with self.session_local() as session:
            for project in self.projects:
                existing_project = Project.by_name(session, project.name)

                if existing_project:
                    session.delete(existing_project)
            session.commit()

            for project in self.projects:
                session.add(project)
            session.commit()

    def init_folder(self):
        database_dir = FilePath(self.config["DATABASE_PATH"]).parent
        database_dir.mkdir(parents=True, exist_ok=True)

        project_root = FilePath(self.folder) if self.folder is not None else FilePath.cwd()
        media_path = project_root / "www" / "media"
        media_path.mkdir(parents=True, exist_ok=True)


def launch_webpack(covfee_client_path, host=None):
    # run the dev server
    with working_directory(covfee_client_path):
        os.system(
            "npx webpack serve"
            + " --config ./webpack.dev.js"
            + ("" if host is None else " --host " + host)
        )
