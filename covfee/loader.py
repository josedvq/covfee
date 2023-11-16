import os
from typing import List

from flask import current_app as app
from halo import Halo
from colorama import init as colorama_init, Fore


from covfee.server.orm.user import User, password_hash
from covfee.cli.utils import working_directory
from pathlib import Path
from covfee.shared.schemata import Schemata
from covfee.shared.validator.ajv_validator import AjvValidator
import json
from covfee.server.orm.project import Project

colorama_init()


def cli_create_tables():
    """
    Creates all the tables defined in the ORM
    """
    with Halo(text="Creating tables", spinner="dots") as spinner:
        spinner.succeed("Created database tables.")


class ProjectExistsException(Exception):
    pass


class Loader:
    """Translates between different covfee file formats"""

    def __init__(self, project_spec_file=None):
        if not os.path.exists(project_spec_file):
            raise FileNotFoundError("covfee file not found.")

        self.project_spec_file = Path(project_spec_file)
        self.file_extension = self.project_spec_file.suffix
        if self.file_extension not in [".py", ".json"]:
            raise ValueError(f"Unsupported file extension {self.file_extension}")

        self.working_dir = self.project_spec_file.parent
        self.projects = []

    def json_parse(self, with_spinner=True):
        with Halo(
            text=f"Parsing file {self.project_spec_file} as json..",
            spinner="dots",
            enabled=with_spinner,
        ) as spinner:
            try:
                project_spec = json.load(open(self.project_spec_file))
            except Exception as e:
                spinner.fail(
                    f"Error parsing file {self.project_spec_file} as JSON. Are you sure it is valid json?"
                )
                raise e

            self.projects.append(project_spec)
            spinner.succeed(f"Read covfee file {self.project_spec_file}.")

    def json_validate(self, with_spinner=False):
        filter = AjvValidator()
        for project_spec in self.projects:
            with Halo(
                text=f'Validating project {project_spec["name"]}',
                spinner="dots",
                enabled=with_spinner,
            ) as spinner:
                try:
                    filter.validate_project(project_spec)
                except Exception as e:
                    spinner.fail(
                        f'Error validating project "{project_spec["name"]}".\n'
                    )
                    raise e
                spinner.succeed(f'Project "{project_spec["name"]}" is valid.')

    def json_make(self, with_spinner=False):
        projects = []
        for project_spec, cf in self.projects:
            with Halo(
                text=f'Making project {project_spec["name"]} from file {cf}',
                spinner="dots",
                enabled=with_spinner,
            ) as spinner:
                projects.append(Project(**project_spec))
                spinner.succeed(
                    f'Project {project_spec["name"]} created successfully from file {cf}'
                )

    def python_load(self):
        pass

    def process(self, with_spinner=False) -> List[Project]:
        if self.file_extension == ".py":
            return self.python_load()
        else:
            # validate the covfee files
            schema = Schemata()
            if not schema.exists():
                schema.make()

            self.json_parse(with_spinner)
            self.validate(with_spinner)
            return self.json_make(with_spinner)
