import os

# URL where the app is available at
BASE_URL = 'http://127.0.0.1:5000'
APP_PORT = 5000
BUNDLE_URL = 'http://localhost:8085/main.js'
ADMIN_BUNDLE_URL = 'http://localhost:8085/admin.js'
COVFEE_SALT = 'CHANGE_ME'

# for app statics
STATIC_PATH = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'static')

# for project media
MEDIA_PATH = os.path.join(os.getcwd(), 'media')
MEDIA_URL = BASE_URL + '/media'
MEDIA_SERVER = True

# for temporary (download) files
TMP_PATH = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'tmp')

# database configurations
DATABASE_PATH = f'{os.path.join(os.getcwd(), "database.covfee.db")}'
SQLALCHEMY_DATABASE_URI = f'sqlite:///{DATABASE_PATH}'
SQLALCHEMY_ENGINE_OPTIONS = {'isolation_level': "READ UNCOMMITTED"}
SQLALCHEMY_TRACK_MODIFICATIONS = False
# SQLALCHEMY_ECHO = True

# Security: JSON web tokens
JWT_SECRET_KEY = 'CHANGE_ME'
# Configure application to store JWTs in cookies. Whenever you make
# a request to a protected endpoint, you will need to send in the
# access or refresh JWT via a cookie.
JWT_TOKEN_LOCATION = ['cookies']

# Set the cookie paths, so that you are only sending your access token
# cookie to the access endpoints, and only sending your refresh token
# to the refresh endpoint. Technically this is optional, but it is in
# your best interest to not send additional cookies in the request if
# they aren't needed.
# JWT_ACCESS_COOKIE_PATH = '/'
# JWT_REFRESH_COOKIE_PATH = '/auth/refresh'
JWT_SECRET_KEY = 'CHANGE_ME'
JWT_COOKIE_CSRF_PROTECT = False
