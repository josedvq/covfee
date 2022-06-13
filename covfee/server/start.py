import os
import json
from tkinter import SE

from flask import current_app as app
from flask import Flask, Blueprint, render_template, send_from_directory
from flask.config import Config
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_socketio import SocketIO
from sqlalchemy.orm import scoped_session, sessionmaker
from sqlalchemy import create_engine

from .orm import load_config
from .rest_api import api, auth, admin_required, add_claims_to_access_token, user_identity_lookup, \
    user_loader_callback

def create_config(mode):
    return load_config(mode=mode)

def create_session(config):
    engine = create_engine(config['SQLALCHEMY_DATABASE_URI'])
    return scoped_session(sessionmaker(bind=engine))

def create_app(mode):
    app = Flask(__name__, static_folder=None)
    app.config.update(create_config(mode))
    app.session = create_session(app.config)
    
    socketio = SocketIO()
    socketio.init_app(app)

    app.register_blueprint(frontend, url_prefix='/')
    app.register_blueprint(api, url_prefix='/api')
    app.register_blueprint(auth, url_prefix='/auth')
    CORS(app, resources={r"/*": {"origins": "*"}})
    jwt = JWTManager(app)

    jwt.user_claims_loader(add_claims_to_access_token)
    jwt.user_identity_loader(user_identity_lookup)
    jwt.user_loader_callback_loader(user_loader_callback)

    @app.teardown_request
    def teardown_request(exception):
        if exception:
            app.session.rollback()
        app.session.remove()
    
    return socketio, app


# APP ROUTES
frontend = Blueprint('frontend', __name__,
                     template_folder=os.path.join(os.path.dirname(os.path.realpath(__file__)), 'templates'))


# annotation app
@frontend.route('/')
def main():
    return render_template('app.html',
                           constants=json.dumps(app.config['FRONTEND_CONFIG']),
                           bundle_url=app.config['BUNDLE_URL'])


# admin interface
@frontend.route('/admin')
def admin():
    return render_template('admin.html',
                           constants=json.dumps(app.config['FRONTEND_CONFIG']),
                           bundle_url=app.config['BUNDLE_URL'])


# project www server
@frontend.route('/www/<path:filename>')
def project_www_file(filename):
    return send_from_directory(app.config['PROJECT_WWW_PATH'], filename)


@frontend.errorhandler(404)
def page_not_found(e):
    # note that we set the 404 status explicitly
    return render_template('404.html'), 404
