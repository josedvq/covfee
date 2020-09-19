import os
ENVIRONMENT = 'development'

# URL where the app is available at
APP_URL = 'http://127.0.0.1:5000'
API_URL = APP_URL + '/api'
APP_PORT = 5000
BUNDLE_URL = 'http://localhost:8085/bundle.js'

# for app statics
STATIC_PATH = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'static')
STATIC_URL = f'{APP_URL}/static'

# for project media
MEDIA_PATH = os.path.join(os.getcwd(), 'media')
MEDIA_URL = f'{APP_URL}/media'

# database configurations
DATABASE_PATH = f'{os.path.join(os.getcwd(), "database.covfee.db")}'
SQLALCHEMY_DATABASE_URI = f'sqlite:///{DATABASE_PATH}'
SQLALCHEMY_ENGINE_OPTIONS = {'isolation_level': "READ UNCOMMITTED"}
SQLALCHEMY_TRACK_MODIFICATIONS = False
