import os

# Configuration file specifying the default covfee behavior
# Can be overwritten via project config

# GENERAL SETTINGS

# server socket where the app will be made available (if running covfee directly)
# covfee supports three environments: local (production), development and deployment (production)
SERVER_SOCKET = '127.0.0.1:5000'
# URL that will be used to access the app
BASE_URL = 'http://127.0.0.1:5000'
#  Security: Used as salt used for generating hash links and for json web tokens (JWT_SECRET_KEY)
COVFEE_SECRET_KEY = 'CHANGE_ME'

# sqlalchemy settings
SQLALCHEMY_ENGINE_OPTIONS = {'isolation_level': "READ UNCOMMITTED"}
SQLALCHEMY_TRACK_MODIFICATIONS = False

COVFEE_BASE_PATH = os.path.join(os.path.dirname(os.path.realpath(__file__)), '..')
COVFEE_CLI_PATH = os.path.join(COVFEE_BASE_PATH, 'cli')
COVFEE_CLIENT_PATH = os.path.join(COVFEE_BASE_PATH, 'client')
SHARED_PATH = os.path.join(COVFEE_BASE_PATH, 'shared')
# for storing the json schemata for validation
DOCS_SCHEMATA_PATH = os.path.join(COVFEE_BASE_PATH, '..', 'docs', 'schemata.json')
FILTER_SCHEMATA_PATH = os.path.join(COVFEE_BASE_PATH, 'cli', 'schemata.json')

# Configure application to store JWTs in cookies. Whenever you make
# a request to a protected endpoint, you will need to send in the
# access or refresh JWT via a cookie.
JWT_TOKEN_LOCATION = ['cookies']
JWT_COOKIE_CSRF_PROTECT = False

# PROJECT FOLDER PATHS

# database
DATABASE_RELPATH = os.path.join(os.getcwd(), '.covfee', 'database.covfee.db')
DATABASE_PATH = os.path.join(os.getcwd(), DATABASE_RELPATH)

# project www and bundle location
PROJECT_WWW_PATH = os.path.join(os.getcwd(), 'www')
PROJECT_WWW_URL = os.path.join(BASE_URL, 'www')
# for project media
SERVE_WWW = True

BUNDLE_URL = PROJECT_WWW_URL
MASTER_BUNDLE_PATH = os.path.join(COVFEE_BASE_PATH, 'client', 'bundles')

# for temporary (download) files
TMP_PATH = os.path.join(os.getcwd(), 'tmp')

# DEV MODE SETTINGS
DEV_BUNDLE_URL = 'http://localhost:8085/main.js'
