import os
import sys
import json
import importlib
from pathlib import Path
from typing import List, Dict

from flask import current_app as app
from halo import Halo
from colorama import init as colorama_init, Fore


from covfee.server.orm.user import User, password_hash
from covfee.cli.utils import working_directory
from covfee.shared.schemata import Schemata
from covfee.shared.validator.ajv_validator import AjvValidator
from covfee.shared.dataclass import CovfeeApp
from covfee.shared.dataclass import Project as ProjectSpec
from covfee.server.orm.project import Project

colorama_init()


def cli_create_tables():
    """
    Creates all the tables defined in the ORM
    """
    with Halo(text="Creating tables", spinner="dots") as spinner:
        spinner.succeed("Created database tables.")


class Loader:
    """Translates between different covfee file formats"""

    _project_spec_file: Path
    _project_spec_from_python_file: bool

    def __init__(self, project_spec_file: str):
        if not os.path.exists(project_spec_file):
            raise FileNotFoundError("covfee file not found.")

        self._project_spec_file = Path(project_spec_file)
        self._project_spec_from_python_file = self._project_spec_file.suffix == ".py"

        if (
            not self._project_spec_from_python_file
            and self._project_spec_file.suffix != ".json"
        ):
            raise ValueError(
                f"Unsupported covfee project specification file type {project_spec_file}"
            )

    def load_project_spec_file_and_parse_as_covfee_app(
        self, with_spinner: bool=False
    ) -> CovfeeApp:
        covfee_app: CovfeeApp
        if self._project_spec_from_python_file:
            covfee_app = self._load_covfee_app_from_python_module()
        else:
            schema = Schemata()
            if not schema.exists():
                schema.make()

            projects_json_specs: List[Dict] = (
                self._load_projects_json_specs_from_json_file(with_spinner)
            )
            self._raise_exception_if_projects_json_specs_are_not_valid(
                projects_json_specs, with_spinner
            )
            covfee_app = self._parse_projects_json_specs_into_covfee_app(
                projects_json_specs, with_spinner
            )

        return covfee_app

    def _load_projects_json_specs_from_json_file(self, with_spinner: bool=True) -> List[Dict]:
        projects_json_specs: List[Dict] = []
        with Halo(
            text=f"Parsing file {self._project_spec_file} as json..",
            spinner="dots",
            enabled=with_spinner,
        ) as spinner:
            try:
                project_json_specs: Dict = json.load(open(self._project_spec_file))
            except Exception as e:
                spinner.fail(
                    f"Error parsing file {self._project_spec_file} as JSON. Are you sure it is valid json?"
                )
                raise e

            projects_json_specs.append(project_json_specs)
            spinner.succeed(f"Read covfee file {self._project_spec_file}.")
        return projects_json_specs

    def _raise_exception_if_projects_json_specs_are_not_valid(
        self, projects_json_specs: List[Dict], with_spinner: bool=False
    ) -> None:
        filter = AjvValidator()
        for project_json_specs in projects_json_specs:
            with Halo(
                text=f'Validating project {project_json_specs["name"]}',
                spinner="dots",
                enabled=with_spinner,
            ) as spinner:
                try:
                    filter.validate_project(project_json_specs)
                except Exception as e:
                    spinner.fail(
                        f'Error validating project "{project_json_specs["name"]}".\n'
                    )
                    raise e
                spinner.succeed(f'Project "{project_json_specs["name"]}" is valid.')

    def _parse_projects_json_specs_into_covfee_app(
        self, projects_json_specs: List[Dict], with_spinner: bool=False
    ) -> CovfeeApp:
        raise NotImplementedError
        # FIXME: ...this function was broken, but was modified to provide a skeleton of what's needed.
        #        ... moreover, the previous version of the code was very unclear regarding what cf is
        #        ...supposed to be and whether it is inside the json data, or somehow added to "self.projects"
        projects_specs: List[ProjectSpec] = []
        for project_json_spec, cf in projects_json_specs:
            with Halo(
                text=f'Making project {project_json_spec["name"]} from file {cf}',
                spinner="dots",
                enabled=with_spinner,
            ) as spinner:

                projects_specs.append(ProjectSpec(**project_json_spec))
                spinner.succeed(
                    f'Project {project_json_spec["name"]} created successfully from file {cf}'
                )
        return CovfeeApp(projects_specs)

    def _load_covfee_app_from_python_module(self) -> CovfeeApp:
        if os.getcwd() not in sys.path:
            sys.path.append(os.getcwd())
        module = importlib.import_module(self._project_spec_file.stem)
        app: CovfeeApp = getattr(module, "app")
        return app
