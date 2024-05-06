import os
import platform
import shutil
import sys
from shutil import which
from datetime import datetime

from click import Path
from colorama import Fore
from covfee.logger import logger

import covfee.server.orm as orm
from covfee.cli.utils import working_directory
from covfee.config import Config
from covfee.server.app import create_app_and_socketio
from covfee.server.db import (
    create_database_engine,
    create_database_sessionmaker,
    DatabaseEngineConfig,
)
from covfee.shared.dataclass import CovfeeApp

from sqlalchemy import Engine
from sqlalchemy.orm import sessionmaker


class ProjectExistsException(Exception):
    def __init__(self, name):
        super().__init__("Conflicting project found in database")
        self.name = name


class Launcher:
    """
    Takes care of:
    1) validating orm_initialization_data
    2) commiting orm_initialization_data to DB (optional)
    3) launching covfee in 'local' or 'dev' mode
    """

    # holds valid _orm_initialization_data
    environment: str
    config: Config
    _covfee_app: CovfeeApp
    folder: Path
    auth_enabled: bool
    engine: Engine
    _sessionmaker: sessionmaker
    _database_modifications_should_be_manually_confirmed: bool = False
    _database_engine_config: DatabaseEngineConfig

    def __init__(
        self,
        environment,
        covfee_app: CovfeeApp,
        folder: Path = None,
        auth_enabled: bool = True,
    ):
        self.environment = environment
        self._covfee_app = covfee_app
        self.config = Config(environment)
        self.folder = folder
        self.auth_enabled = auth_enabled

        if environment != "dev":
            self._database_engine_config = DatabaseEngineConfig(
                database_file=self.config["DATABASE_PATH"],
            )
            self._database_modifications_should_be_manually_confirmed = os.path.exists(
                self._database_engine_config.database_file
            )
        else:
            # In memory database for development and debugging
            self._database_engine_config = DatabaseEngineConfig()

        self.engine = create_database_engine(self._database_engine_config)
        self._sessionmaker = create_database_sessionmaker(self.engine)

    def create_or_update_database(self, delete_existing_data: bool = False):
        # 1. Create the folders for the database and media
        os.makedirs(os.path.join(self.folder, ".covfee"), exist_ok=True)
        os.makedirs(os.path.join(self.folder, "www", "media"), exist_ok=True)

        # 2. Delete old tables if "delete_existing_data" is True. Then create tables.
        if delete_existing_data:
            if self._database_modifications_should_be_manually_confirmed:
                confirmation = input(
                    "Are you sure you want to delete existing database tables? (yes/no): "
                )
                if confirmation.lower() != "yes":
                    print("Aborting...")
                    exit()

                self._make_a_backup_of_the_database_file()

            orm.Base.metadata.drop_all(self.engine)
        orm.Base.metadata.create_all(self.engine)

        # 3. Create the admin user if required and not existing in the database
        self._create_admin_user_in_database_if_needed()

        with self._sessionmaker() as session:
            # 4. Now, we update the database according to the covfee app specification
            #    given by the user. If the projects already existed, then it either
            #    keeps the database as is, or, if the user is adding more HITs/Journeys
            #    through the global_unique_id mechanic, then it updates the database with
            #    new HITs/Journeys with global_unique_ids which are not already in the database.
            #    All the others are ignored/kept as is.
            self._covfee_app.add_to_database_new_or_updated_projects_specifications_and_instances(
                session
            )

            # 5. Prior to commit the changes, check with the user that this is intentional.
            if (
                self._database_modifications_should_be_manually_confirmed
                and not delete_existing_data
                and (session.new or session.dirty or session.deleted)
            ):
                user_confirmation_response = input(
                    "The database will be modified. Are you sure you want to continue? (yes/no): "
                )
                if user_confirmation_response.lower() != "yes":
                    print("Aborting...")
                    exit()
                else:
                    self._make_a_backup_of_the_database_file()
            else:
                logger.info("No database modifications were detected.")

            session.commit()
            session.close()

    def _make_a_backup_of_the_database_file(self) -> None:
        database_backup_filename = f"{self._database_engine_config.database_file}.backup.{datetime.now().strftime('%Y%m%d%H%M%S')}"
        logger.info(f"Creating database backup: {database_backup_filename}...")
        shutil.copy2(
            self._database_engine_config.database_file,
            database_backup_filename,
        )

    def launch(self, host="0.0.0.0", port=5000):
        if self.environment != "dev":
            self.link_bundles()

        socketio, app = create_app_and_socketio(self.environment, self._sessionmaker)
        with app.app_context():
            app.config["UNSAFE_MODE_ON"] = not self.auth_enabled
            self._start_server(socketio, app, host, port)

    def _create_admin_user_in_database_if_needed(self):
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
            with self._sessionmaker() as session:
                user = orm.User.by_username(session, username)
                if user is not None:
                    return
                admin = orm.User.from_username_password(
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
        if self.environment == "local":
            socketio.run(app, host=host, port=port, **ssl_options)
        elif self.environment == "dev":
            socketio.run(app, host=host, port=port, debug=True, **ssl_options)
        elif self.environment == "deploy":
            socketio.run(app, host=host, port=port, **ssl_options)
        else:
            raise f"unrecognized self.environment {self.environment}"

    def launch_browser(self, unsafe=False):
        target_url = self.config["ADMIN_URL"] if unsafe else self.config["LOGIN_URL"]
        if which("xdg-open") is not None:
            os.system(f"xdg-open {target_url}")
        elif sys.platform == "darwin" and which("open") is not None:
            os.system(f"open {target_url}")
        else:
            print(Fore.GREEN + f" * covfee is available at {target_url}")

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
