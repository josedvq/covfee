import importlib
import json
import os
import sys
from pathlib import Path
from typing import List

from colorama import init as colorama_init
from halo import Halo

from covfee.server.orm.project import Project
from covfee.server.orm.user import Base
from covfee.shared.schemata import Schemata
from covfee.shared.validator.ajv_validator import AjvValidator

colorama_init()


def cli_create_tables():
    """
    Creates all the tables defined in the ORM
    """
    with Halo(text="Creating tables", spinner="dots") as spinner:
        spinner.succeed("Created database tables.")


class Loader:
    """Translates between different covfee file formats"""

    def __init__(self, project_spec_file=None, config=None):
        self.project_spec_file = self._resolve_project_spec_path(project_spec_file)
        if not self.project_spec_file.exists():
            raise FileNotFoundError("covfee file not found.")
        self.config = config
        self.file_extension = self.project_spec_file.suffix
        if self.file_extension not in [".py", ".json"]:
            raise ValueError(f"Unsupported file extension {self.file_extension}")
        if self.file_extension == ".py" and self.project_spec_file.name != "app.py":
            raise ValueError('Python project entrypoints must be named "app.py".')

        self.working_dir = self.project_spec_file.parent
        self.projects = []

    def _resolve_project_spec_path(self, project_spec_file: str | os.PathLike | None) -> Path:
        """Resolve a project directory or explicit spec path to a concrete file."""
        if project_spec_file is None:
            raise FileNotFoundError("covfee file not found.")

        path = Path(project_spec_file)
        if path.is_dir():
            return path / "app.py"
        return path

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
        if os.getcwd() not in sys.path:
            sys.path.append(os.getcwd())
        module = importlib.import_module(self.project_spec_file.stem)
        covfee_app = getattr(module, "app")
        self.projects += covfee_app.get_instantiated_projects()

    def process(self, with_spinner=False) -> List[Project]:
        Base._config = self.config
        if self.file_extension == ".py":
            self.python_load()
        else:
            # validate the covfee files
            schema = Schemata()
            if not schema.exists():
                schema.make()

            self.json_parse(with_spinner)
            self.json_validate(with_spinner)
            self.json_make(with_spinner)
        return self.projects
