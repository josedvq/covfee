import os
import json

def start():
    covfee_path = os.path.dirname(os.path.realpath(__file__))

    # add custom tasks folder to package.json, and write file back
    alias = {
        'CustomTasks': os.path.join(os.getcwd(), 'covfee_tasks')
    }    

    with open(os.path.join(covfee_path, 'alias.json'), 'w') as outfile:
        json.dump(alias, outfile, indent=2)

    # run the dev server
    os.chdir(covfee_path)
    os.system(f'./node_modules/.bin/webpack-dev-server --config ./webpack.dev.js')

def build():
    covfee_path = os.path.dirname(os.path.realpath(__file__))

    # add custom tasks folder to package.json, and write file back
    alias = {
        'CustomTasks': os.path.join(os.getcwd(), 'covfee_tasks')
    }

    with open(os.path.join(covfee_path, 'alias.json'), 'w') as outfile:
        json.dump(alias, outfile, indent=2)

    # run the dev server
    os.chdir(covfee_path)
    os.system(f'./node_modules/.bin/webpack --config ./webpack.dev.js')


def set_env(env: str):
    env_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'covfee.env.json')
    json.dump({'FLASK_ENV': env}, open(env_path, 'w'), indent=2)

def set_env_dev():
    return set_env('development')

def set_env_prod():
    return set_env('production')
