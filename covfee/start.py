import os

from flask import request, jsonify, Blueprint, render_template, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from .orm import app
from .rest_api import api, auth, admin_required, add_claims_to_access_token, user_identity_lookup, user_loader_callback

def create_app():
    app.register_blueprint(frontend, url_prefix='/')
    app.register_blueprint(api, url_prefix='/api')
    app.register_blueprint(auth, url_prefix='/auth')
    cors = CORS(app, resources={r"/*": {"origins": "*"}})
    jwt = JWTManager(app)

    jwt.user_claims_loader(add_claims_to_access_token)
    jwt.user_identity_loader(user_identity_lookup)
    jwt.user_loader_callback_loader(user_loader_callback)
    
    return app

# APP ROUTES
frontend = Blueprint('frontend', __name__,
    template_folder=os.path.join(os.path.dirname(os.path.realpath(__file__)), 'templates'))


@frontend.route('/')
def main():
    return render_template('app.html',
                           static_url=app.config['STATIC_URL'],
                           bundle_url=app.config['BUNDLE_URL'])

# admin interface


@frontend.route('/admin')
@admin_required
def admin():
    return render_template('admin.html',
                           static_url=app.config['STATIC_URL'],
                           bundle_url=app.config['ADMIN_BUNDLE_URL'])


@frontend.route('/static/<path:filename>')
def static_file(filename):
    return send_from_directory(app.config['STATIC_PATH'], filename,
                               conditional=True)


@frontend.route('/media/<path:filename>')
def media_file(filename):
    print(app.config['MEDIA_PATH'])
    return send_from_directory(app.config['MEDIA_PATH'], filename,
                               conditional=True)
