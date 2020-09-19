import os 

def start():
    covfee_path = os.path.dirname(os.path.realpath(__file__))
    os.chdir(covfee_path)
    os.system(f'./node_modules/.bin/webpack-dev-server --open --config ./webpack.dev.js')