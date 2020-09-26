import os
import json

def prepare():
    covfee_path = os.path.dirname(os.path.realpath(__file__))

    custom_tasks_path = os.path.join(os.getcwd(), 'covfee_tasks')

    if not os.path.exists(custom_tasks_path):
        os.mkdir(custom_tasks_path)

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

def start():
    
    prepare()
    
    # run the dev server
    covfee_path = os.path.dirname(os.path.realpath(__file__))
    os.chdir(covfee_path)
    os.system(f'./node_modules/.bin/webpack-dev-server --config ./webpack.dev.js')

def build():
    prepare()

    # run the dev server
    covfee_path = os.path.dirname(os.path.realpath(__file__))
    os.chdir(covfee_path)
    os.system(f'./node_modules/.bin/webpack --config ./webpack.dev.js')


def set_env(env: str):
    env_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'covfee.env.json')
    json.dump({'FLASK_ENV': env}, open(env_path, 'w'), indent=2)

def set_env_dev():
    return set_env('development')

def set_env_prod():
    return set_env('production')
