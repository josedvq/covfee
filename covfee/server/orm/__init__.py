import os
from urllib.parse import urlparse

from .orm import db, app
from .hit import *
from .project import *
from .task import *
from .user import *

# determine the mode: dev/prod
app.config['COVFEE_ENV'] = os.getenv('COVFEE_ENV', 'production')

# load the default configuration object
app.config.from_object('covfee.server.config')

# update with the custom project config files
if app.config['COVFEE_ENV'] == 'development':
    app.config.from_pyfile(os.path.join(
        os.getcwd(), 'covfee.development.config.py'), silent=True)
else:
    app.config.from_pyfile(os.path.join(
        os.getcwd(), 'covfee.production.config.py'), silent=True)

# apply extended config
app_path = urlparse(app.config['BASE_URL']).path
if app_path == '':
    app_path = '/'

app.config.update(
    # copy over secret key
    JWT_SECRET_KEY=app.config['COVFEE_SECRET_KEY'],

    # create sqlalchemy database uri
    SQLALCHEMY_DATABASE_URI=f'sqlite:///{app.config["DATABASE_PATH"]}',

    # create derived URLs
    APP_URL=app.config['BASE_URL'] + '/#',
    ADMIN_URL=app.config['BASE_URL'] + '/admin#',
    API_URL=app.config['BASE_URL'] + '/api',
    AUTH_URL=app.config['BASE_URL'] + '/auth',
    STATIC_URL=app.config['BASE_URL'] + '/static',
    # Set the cookie paths, so that you are only sending your access token
    # cookie to the access endpoints, and only sending your refresh token
    # to the refresh endpoint. Technically this is optional, but it is in
    # your best interest to not send additional cookies in the request if
    # they aren't needed.
    JWT_ACCESS_COOKIE_PATH=app_path,
    JWT_REFRESH_COOKIE_PATH=os.path.join(app_path, 'auth/refresh')
)

# point to webpack-dev-server bundles in dev mode
if app.config['COVFEE_ENV'] == 'development':
    app.config['BUNDLE_URL'] = app.config['DEV_BUNDLE_URL']
    app.config['ADMIN_BUNDLE_URL'] = app.config['DEV_ADMIN_BUNDLE_URL']


app.app_context().push()
db.init_app(app)
