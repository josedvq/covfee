import os

# Configuration file for the default covfee behavior

# URL where the app is available at
BASE_URL = 'http://127.0.0.1:5000'
APP_PORT = 5000
COVFEE_SALT = 'CHANGE_ME'

# project www and bundle location
PROJECT_WWW_PATH = os.path.join(os.getcwd(), '.covfee/www')
PROJECT_WWW_URL = BASE_URL + '/www'
BUNDLE_URL = PROJECT_WWW_URL + '/main.js'
ADMIN_BUNDLE_URL = PROJECT_WWW_URL + '/admin.js'

# dev mode settings
DEV_BUNDLE_URL = 'http://localhost:8085/main.js'
DEV_ADMIN_BUNDLE_URL = 'http://localhost:8085/admin.js'



# for project media
MEDIA_PATH = os.path.join(os.getcwd(), 'media')
MEDIA_URL = BASE_URL + '/media'
MEDIA_SERVER = True

# for storing the json schemata for validation
SHARED_PATH = os.path.join(os.path.dirname(os.path.realpath(__file__)), '../shared')
SCHEMATA_PATH = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'schemata.json')

# for temporary (download) files
TMP_PATH = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'tmp')

# database configurations
DATABASE_RELPATH = '.covfee/database.covfee.db'
DATABASE_PATH = os.path.join(os.getcwd(), DATABASE_RELPATH)
SQLALCHEMY_DATABASE_URI = f'sqlite:///{DATABASE_PATH}'
SQLALCHEMY_ENGINE_OPTIONS = {'isolation_level': "READ UNCOMMITTED"}
SQLALCHEMY_TRACK_MODIFICATIONS = False

# Security: JSON web tokens
JWT_SECRET_KEY = 'CHANGE_ME'
# Configure application to store JWTs in cookies. Whenever you make
# a request to a protected endpoint, you will need to send in the
# access or refresh JWT via a cookie.
JWT_TOKEN_LOCATION = ['cookies']
JWT_COOKIE_CSRF_PROTECT = False
