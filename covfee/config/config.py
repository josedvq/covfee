import os
import flask
from urllib.parse import urlparse

def load_config(app, mode: str):
    config = get_config(mode)
    app.config.update(config)

def get_config(mode: str) -> flask.Config:
    config = flask.Config()
    config['COVFEE_ENV'] = mode
    # load the base configuration object
    config.from_object('covfee.server.config.defaults')

    # update with the custom project config files
    if mode == 'local':
        config.from_pyfile(os.path.join(
            os.getcwd(), 'covfee.local.config.py'), silent=True)
    elif mode == 'dev':
        config.from_pyfile(os.path.join(
            os.getcwd(), 'covfee.development.config.py'), silent=True)
    elif mode == 'deploy':
        config.from_pyfile(os.path.join(
            os.getcwd(), 'covfee.deployment.config.py'), silent=True)
    else:
        raise Exception(f'Unrecognized application mode {mode}.')

    # check if SSL enabled
    config['SSL_ENABLED'] = ('SSL_KEY_FILE' in config and 'SSL_CERT_FILE' in config)

    # apply extended config
    app_path = urlparse(config['BASE_URL']).path
    if app_path == '':
        app_path = '/'

    config.update(
        # copy over secret key
        JWT_SECRET_KEY=config['COVFEE_SECRET_KEY'],

        # create sqlalchemy database uri
        SQLALCHEMY_DATABASE_URI=f'sqlite:///{config["DATABASE_PATH"]}',

        # create derived URLs
        PROJECT_WWW_URL=config.get('PROJECT_WWW_URL', config['BASE_URL'] + '/www'),
        APP_URL=config['BASE_URL'] + '/#',
        ADMIN_URL=config['BASE_URL'] + '/admin#',
        LOGIN_URL=config['BASE_URL'] + '/admin#login',
        API_URL=config['BASE_URL'] + '/api',
        AUTH_URL=config['BASE_URL'] + '/auth',
        # Set the cookie paths, so that you are only sending your access token
        # cookie to the access endpoints, and only sending your refresh token
        # to the refresh endpoint. Technically this is optional, but it is in
        # your best interest to not send additional cookies in the request if
        # they aren't needed.
        JWT_ACCESS_COOKIE_PATH=app_path,
        JWT_REFRESH_COOKIE_PATH=os.path.join(app_path, 'auth/refresh')
    )

    # point to webpack-dev-server bundles in dev mode
    if mode == 'dev':
        config['BUNDLES_URL'] = config['DEV_BUNDLES_URL']
    

def get_frontend_config(config):
    # create the frontend config object:
    return {
        # frontend only has two environments: production and development
        'env': 'production' if config['COVFEE_ENV'] in ['local', 'deploy'] else 'development',
        'socketio_enabled': config['SOCKETIO_ENABLED'],
        'google_client_id': config['GOOGLE_CLIENT_ID'],
        'www_url': config['PROJECT_WWW_URL'],
        'app_url': config['APP_URL'],
        'base_url': config['BASE_URL'],
        'api_url': config['API_URL'],
        'auth_url': config['AUTH_URL'],
        'admin': {
            'unsafe_mode_on': config.get('UNSAFE_MODE_ON', False),
            'home_url': config['ADMIN_URL'],
            'login_url': config['LOGIN_URL']
        }
    }