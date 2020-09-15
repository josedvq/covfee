import os
ENVIRONMENT = 'development'
PROJECTS_PATH = 'projects'
DATABASE_PATH = 'database.db'
APP_URL = 'http://127.0.0.1:5000'
STATIC_URL = 'http://127.0.0.1:5000/static'
APP_PORT = 5000
API_URL = APP_URL + '/api'
BUNDLE_URL = 'http://localhost:8085/bundle.js'
DATABASE = f'sqlite:///{os.path.dirname(os.path.realpath(__file__))}/database.db'
