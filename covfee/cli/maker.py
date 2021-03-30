import os
import sys
import json
from pathlib import Path

import click
from halo import Halo
from colorama import init, Fore
init()

from covfee.server.orm import app, db, Project, User
from .utils import look_for_covfee_files, working_directory
from .filter import cli_validate_project, cli_get_schemata
from ..commands import start_dev, start_prod, open_covfee_admin, build
from .project_folder import ProjectFolder




@click.command()
@click.option("--force", is_flag=True, help="Specify to overwrite existing databases.")
@click.option("--unsafe", is_flag=True, help="Disables authentication for the covfee instance.")
@click.option("--rms", is_flag=True, help="Re-makes the schemata for validation.")
@click.argument("file_or_folder")
def make_db(force, unsafe, rms, file_or_folder):
    project_folder = ProjectFolder(os.getcwd())

    # ask user what to do if the database file exists
    if project_folder.is_project():
        if force:
            res = input(Fore.RED+'This action will remove an existing database, including annotations. Are you sure you want to recreate the db? (y/n)')
            if res == 'y':
                project_folder.clear()
                project_folder.init()
            else:
                sys.exit(1)
        else:
            print(
                'Database already exists. Run with the --force option to overwrite.')
    else:
        # create db
        project_folder.init()

    with Halo(text='Looking for .covfee.json files', spinner='dots') as spinner:
        covfee_files = look_for_covfee_files(file_or_folder)

        if covfee_files is None:
            spinner.fail(f'Path {file_or_folder} does not point to a file or folder.')
            return
        spinner.succeed(f'{len(covfee_files)} project files found.')

    schemata = cli_get_schemata(remake=rms)
    for cf in covfee_files:
        # reading
        with Halo(text=f'Reading file {cf}', spinner='dots') as spinner:
            with open(cf) as f:
                project_spec = json.load(f)
            spinner.succeed(f'Project file {cf} read successfully')

        # validation
        valid = cli_validate_project(schemata, project_spec, cf)
        if not valid:
            sys.exit(1)

        # delete existing project with the same id
        with Halo(text=f'Looking for existing projects with id {project_spec["id"]}', spinner='dots') as spinner:
            projid = Project.get_id(project_spec['id'])
            existing_project = Project.query.filter_by(id=projid).first()
            if existing_project is not None:
                if force:
                    db.session.delete(existing_project)
                    db.session.commit()
                    spinner.warn(f'Deleted existing project with conflicting ID {project_spec["id"]}')
                else:
                    spinner.fail('Project exists. Add --force option to overwrite.')
                    sys.exit(1)

        # making
        with Halo(text=f'Making project {project_spec["name"]} from file {cf}', spinner='dots') as spinner:
            project = Project(**project_spec)
            db.session.add(project)
            spinner.succeed(f'Project {project_spec["name"]} created successfully from file {cf}')

    db.session.commit()

    if os.getenv('COVFEE_ENV') == 'development':
        open_covfee_admin()
        start_dev(unsafe=unsafe)
    else:
        build()
        open_covfee_admin()
        start_prod(unsafe=unsafe)


@click.command()
def make_user():
    if not os.path.exists(app.config['DATABASE_PATH']):
        cli_create_tables()
    username = input('Please enter username: ')
    password = input('Please enter password: ')
    user = User(username, password, ['admin'])
    db.session.add(user)
    db.session.commit()
    print('User has been created!')
