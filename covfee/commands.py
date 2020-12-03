import os
import sys
import glob
import json
import subprocess

import click
from pathlib import Path

from covfee.orm import app, db, Project, HIT, Task, Chunk, User

# DATABASE CREATION
def create_tables():
    db.create_all()

def prepare():
    covfee_path = os.path.dirname(os.path.realpath(__file__))

    custom_tasks_path = os.path.join(os.getcwd(), 'covfee_tasks')

    if not os.path.exists(custom_tasks_path):
        os.mkdir(custom_tasks_path)

    # create a JSON file with constants for the front-end
    app_constants = {
        'env': app.config['FLASK_ENV'],
        'app_url': app.config['APP_URL'],
        'admin_url': app.config['ADMIN_URL'],
        'api_url': app.config['API_URL'],
        'auth_url': app.config['AUTH_URL'],
        'media_url': app.config['MEDIA_URL']
    }

    constants_path = os.path.join(covfee_path, 'app/src/constants.json')
    json.dump(app_constants, open(constants_path, 'w'), indent=2)

    # create a javascript custom tasks module if it does not exist
    fpaths = [os.path.join(custom_tasks_path, fname)
              for fname in ['index.js', 'index.jsx', 'index.ts', 'index.tsx']]

    fpaths_exist = [os.path.exists(fpath) for fpath in fpaths]
    if not any(fpaths_exist):
        with open(fpaths[0], 'w') as fh:
            fh.write('export {}')

    alias = {
        'CustomTasks': custom_tasks_path
    }

    with open(os.path.join(covfee_path, 'alias.json'), 'w') as outfile:
        json.dump(alias, outfile, indent=2)


@click.command()
@click.option("--force", is_flag=True, help="Specify to overwrite existing databases.")
@click.argument("file_or_folder")
def make_db(force, file_or_folder):
    dbpath = app.config['DATABASE_PATH']
    
    json_files = []
    # ask user what to do if the database file exists
    if os.path.exists(app.config['DATABASE_PATH']):
        if os.path.isdir(file_or_folder):
            if force:
                res = input('This action will remove an existing database, including annotations. Are you sure you want to recreate the db? (y/n)')
                if res == 'y':
                    try:
                        os.remove(app.config['DATABASE_PATH'])
                        print(
                            f'deleted existing database file {app.config["DATABASE_PATH"]}')
                    except OSError:
                        print(f'Error removing existing database file {app.config["DATABASE_PATH"]}')
                        sys.exit(1)
                    create_tables()
                else:
                    sys.exit(1)
            else:
                print('Database already exists. Run with the --force option to overwrite.')
    else:
    # create db
        create_tables()

    # database exists and tables are created
    if os.path.isdir(file_or_folder):
        for json_path in Path(file_or_folder).rglob('*.covfee.json'):
            json_files.append(json_path)
    elif os.path.isfile(file_or_folder):
        json_files.append(file_or_folder)
    else:
        print(f'Path {file_or_folder} does not point to a file or folder.')
        sys.exit(1)
        
    for json_file in json_files:
        project = Project.from_json(json_file)

        # delete existing project with the same id
        existing_project = Project.query.filter_by(id=project.id).first()
        if existing_project is not None:
            if force:
                # print('DELETING')
                db.session.delete(existing_project)
            else:
                print('Project exists. Add --force option to overwrite.')
                sys.exit(1)

        db.session.add(project)
        print(project.info())

    db.session.commit()


@click.command()
@click.argument("fpath")
def update_db(fpath):
    dbpath = app.config['DATABASE_PATH']

    with open(fpath, 'r') as f:
        proj_dict = json.load(f)

    project = db.session.query(Project).get(Project.get_id(proj_dict['id']))
    project.update(**proj_dict)
    print(project.info())

    db.session.commit()

@click.command()
def make_user():
    if not os.path.exists(app.config['DATABASE_PATH']):
        create_tables()
    username = input('Please enter username: ')
    password = input('Please enter password: ')
    user = User(username, password, ['admin'])
    db.session.add(user)
    db.session.commit()
    print('User has been created!')

@click.command()
def webpack():
    prepare()
    
    # run the dev server
    covfee_path = os.path.dirname(os.path.realpath(__file__))
    os.chdir(covfee_path)
    os.system(os.path.join('node_modules', '.bin', 'webpack-dev-server') + ' --config ./webpack.dev.js')


@click.command()
def start_dev():
    os.environ['FLASK_ENV'] = 'development'
    os.environ['FLASK_APP'] = 'covfee.start:create_app'
    os.system(sys.executable + ' -m flask run')

@click.command()
def start_prod():
    os.environ['FLASK_ENV'] = 'production'
    os.environ['FLASK_APP'] = 'covfee.start:create_app'
    os.system(sys.executable + ' -m flask run')


@click.command()
def build():
    prepare()

    # run the dev server
    covfee_path = os.path.dirname(os.path.realpath(__file__))
    os.chdir(covfee_path)
    os.system(os.path.join('node_modules', '.bin', 'webpack') + ' --config ./webpack.dev.js')


def set_env(env: str):
    env_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'covfee.env.json')
    json.dump({'FLASK_ENV': env}, open(env_path, 'w'), indent=2)


@click.command()
def set_env_dev():
    return set_env('development')


@click.command()
def set_env_prod():
    return set_env('production')


@click.command()
def install_js():
    fpath = os.path.dirname(os.path.realpath(__file__))
    os.chdir('covfee')
    os.system('npm install')
