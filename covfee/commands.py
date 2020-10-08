import os
import sys
import glob
import json

import click

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
        'auth_url': app.config['AUTH_URL']    
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
@click.option("--save", default=None, help="JSON file for outputing the specification including URLs.")
@click.argument("json")
def make_db(force, json, save):
    dbpath = app.config['DATABASE_PATH']
    if force:
        try:
            os.remove(app.config['DATABASE_PATH'])
            print(
                f'deleted existing database file {app.config["DATABASE_PATH"]}')
        except OSError:
            pass
    create_tables()
    project = Project.from_json(json)
    db.session.add(project)
    db.session.commit()
    print(project.info())

    # if save is not None:
    #     json.dump(project_dict, open(save, 'w'), indent=2)

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
def start():
    
    prepare()
    
    # run the dev server
    covfee_path = os.path.dirname(os.path.realpath(__file__))
    os.chdir(covfee_path)
    os.system(f'./node_modules/.bin/webpack-dev-server --config ./webpack.dev.js')


@click.command()
def build():
    prepare()

    # run the dev server
    covfee_path = os.path.dirname(os.path.realpath(__file__))
    os.chdir(covfee_path)
    os.system(f'./node_modules/.bin/webpack --config ./webpack.dev.js')


def set_env(env: str):
    env_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'covfee.env.json')
    json.dump({'FLASK_ENV': env}, open(env_path, 'w'), indent=2)


@click.command()
def set_env_dev():
    return set_env('development')


@click.command()
def set_env_prod():
    return set_env('production')

