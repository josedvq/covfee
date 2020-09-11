import os
ENVIRONMENT = 'production'
PROJECTS_PATH = 'projects'
DATABASE_PATH = 'database.db'
APP_URL = 'http://helix.ewi.tudelft.nl/covfee'
STATIC_URL = 'http://helix.ewi.tudelft.nl/covfee-static'
APP_PORT = 80
API_URL = APP_URL + '/api'
BUNDLE_URL = STATIC_URL + '/bundle.js'
DATABASE = f'sqlite:///{os.path.dirname(os.path.realpath(__file__))}/database.db'
