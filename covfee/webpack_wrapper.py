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
