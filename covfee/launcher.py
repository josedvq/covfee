import os
import platform
import shutil
import sys
import json
from shutil import which
from typing import Any, List
from click import Path

from halo.halo import Halo
from colorama import init as colorama_init, Fore
from covfee.loader import cli_create_tables

from covfee.server.db import get_session_local, get_engine
from covfee.config import Config
import covfee.server.orm as orm
from covfee.shared.validator.ajv_validator import AjvValidator
from covfee.server.app import create_app
from covfee.cli.utils import working_directory


class ProjectExistsException(Exception):
    def __init__(self, name):
        super().__init__("Conflicting project found in database")
        self.name = name


class Launcher:
    """
    Takes care of:
    1) validating projects
    2) commiting projects to DB (optional)
    3) launching covfee in 'local' or 'dev' mode
    """

    # holds valid projects
    projects: List["orm.Project"]

    def __init__(
        self, environment, projects: List["orm.Project"] = [], folder: Path = None
    ):
        self.environment = environment
        self.config = Config(environment)
        self.projects = projects
        self.folder = folder

        self.engine = get_engine(
            in_memory=(environment == "dev"), db_path=self.config["DATABASE_PATH"]
        )
        self.session_local = get_session_local(self.engine)

    def make_database(self, force=False, with_spinner=False):
        self.init_folder()
        self.create_tables()
        if not force:
            with Halo(
                text=f"Looking for existing projects",
                spinner="dots",
                enabled=with_spinner,
            ) as spinner:
                try:
                    self.check_conficts()
                except ProjectExistsException as ex:
                    spinner.fail("Conflicts found")
                    raise ex

        self.commit()

    def launch(self):
        if self.environment != "dev":
            self.link_bundles()
        self.start_server("dev")

    def create_tables(self):
        orm.Base.metadata.create_all(self.engine)

    def start_server(self, no_browser=False):
        """
        Starts covfee in local mode by default.
        Use deploy or dev to start deployment (public) or development servers.
        """
        socketio, app = create_app(self.environment, self.session_local)
        with app.app_context():
            app.config["UNSAFE_MODE_ON"] = True
            self._start_server(socketio, app)

    def _start_server(self, socketio, app, host="0.0.0.0"):
        if app.config["SSL_ENABLED"]:
            ssl_options = {
                "keyfile": self.config["SSL_KEY_FILE"],
                "certfile": self.config["SSL_CERT_FILE"],
            }
        else:
            ssl_options = {}

        print(f"Running covfee at {host}:{5000} with environment={self.environment}")
        if self.environment == "local":
            socketio.run(app, host=host, port=5000, **ssl_options)
        elif self.environment == "dev":
            socketio.run(app, host=host, port=5000, debug=True, **ssl_options)
        elif self.environment == "deploy":
            socketio.run(app, host=host, **ssl_options)
        else:
            raise f"unrecognized self.environment {self.environment}"

        # from covfee.server.socketio.redux_store import ReduxStoreService
        # redux_store = ReduxStoreService()
        # redux_store.run()

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
                existing_project = orm.Project.from_name(session, project.name)
                if existing_project:
                    raise ProjectExistsException(project.name)

    def commit(self):
        with self.session_local() as session:
            for project in self.projects:
                existing_project = orm.Project.from_name(session, project.name)

                if existing_project:
                    session.delete(existing_project)
            session.commit()

            for project in self.projects:
                session.add(project)
            session.commit()

    def init_folder(self):
        covfee_hidden = os.path.join(self.folder, ".covfee")
        if not os.path.exists(covfee_hidden):
            os.makedirs(covfee_hidden)
        media_path = os.path.join(self.folder, "www", "media")
        if not os.path.exists(media_path):
            os.makedirs(media_path)

    def link_bundles(self):
        master_bundle_path = os.path.join(self.config["MASTER_BUNDLE_PATH"], "main.js")
        if not os.path.exists(master_bundle_path):
            raise Exception("Master bundles not found.")
        bundle_path = os.path.join(self.config["PROJECT_WWW_PATH"], "main.js")
        if os.path.exists(bundle_path):
            os.remove(bundle_path)
        # windows requires admin rights for symlinking -> fall back to copying
        if platform.system() == "Windows":
            shutil.copyfile(master_bundle_path, bundle_path)
        else:
            os.symlink(master_bundle_path, bundle_path)

        admin_bundle_path = os.path.join(self.config["PROJECT_WWW_PATH"], "admin.js")
        if os.path.exists(admin_bundle_path):
            os.remove(admin_bundle_path)
        if platform.system() == "Windows":
            shutil.copyfile(
                os.path.join(self.config["MASTER_BUNDLE_PATH"], "admin.js"),
                admin_bundle_path,
            )
        else:
            os.symlink(
                os.path.join(self.config["MASTER_BUNDLE_PATH"], "admin.js"),
                admin_bundle_path,
            )


def launch_webpack(covfee_client_path, host=None):
    # run the dev server
    with working_directory(covfee_client_path):
        os.system(
            "npx webpack serve"
            + " --config ./webpack.dev.js"
            + ("" if host is None else " --host " + host)
        )
