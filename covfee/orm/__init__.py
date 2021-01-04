import os
from urllib.parse import urlparse

from .orm import db, app
from .hit import *
from .project import *
from .task import *
from .user import *

# load the config files
app.config.from_object('covfee.config')
app.config.from_json(os.path.join(os.path.dirname(os.path.realpath(__file__)), '..', 'covfee.env.json'))
if app.config['FLASK_ENV'] == 'development':
    app.config.from_pyfile(os.path.join(
        os.getcwd(), 'covfee.development.config.py'), silent=True)
else:
    app.config.from_pyfile(os.path.join(
        os.getcwd(), 'covfee.production.config.py'))

# apply extended config
app_path = urlparse(app.config['BASE_URL']).path
if app_path == '':
    app_path = '/'

app.config.update(
    APP_URL= app.config['BASE_URL'] + '/#',
    ADMIN_URL= app.config['BASE_URL'] + '/admin#',
    API_URL= app.config['BASE_URL'] + '/api',
    AUTH_URL= app.config['BASE_URL'] + '/auth',
    STATIC_URL= app.config['BASE_URL'] + '/static',
# Set the cookie paths, so that you are only sending your access token
# cookie to the access endpoints, and only sending your refresh token
# to the refresh endpoint. Technically this is optional, but it is in
# your best interest to not send additional cookies in the request if
# they aren't needed.
    JWT_ACCESS_COOKIE_PATH=app_path,
    JWT_REFRESH_COOKIE_PATH=os.path.join(app_path, 'auth/refresh')
)

app.app_context().push()
db.init_app(app)
