import os

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

app.config.update(
    APP_URL= app.config['BASE_URL'] + '/#',
    ADMIN_URL= app.config['BASE_URL'] + '/admin#',
    API_URL= app.config['BASE_URL'] + '/api',
    AUTH_URL= app.config['BASE_URL'] + '/auth',
    STATIC_URL= app.config['BASE_URL'] + '/static'
)
        
app.app_context().push()
db.init_app(app)
