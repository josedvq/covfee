import os
import hmac
import hashlib

from functools import wraps

from google.oauth2 import id_token
from google.auth.transport import requests
from flask import abort, request, jsonify, Blueprint, current_app as app
from flask_jwt_extended import (
    JWTManager, jwt_required, create_access_token, create_refresh_token, get_current_user,
    set_access_cookies, set_refresh_cookies, jwt_refresh_token_required, unset_jwt_cookies,
    get_jwt_identity, get_jwt_claims, verify_jwt_in_request
)

from ..orm import db, User, AuthProvider, password_hash

# AUTHENTICATION
# Using the user_claims_loader, we can specify a method that will be
# called when creating access tokens, and add these claims to the said
# token. This method is passed the identity of who the token is being
# created for, and must return data that is json serializable
# Here is a custom decorator that verifies the JWT is present in
# the request, as well as insuring that this user has a role of
# `admin` in the access token
def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if app.config.get('UNSAFE_MODE_ON', False):
            return fn(*args, **kwargs)
        verify_jwt_in_request()
        claims = get_jwt_claims()
        if 'admin' not in claims['roles']:
            return jsonify(msg='Admins only!'), 403
        else:
            return fn(*args, **kwargs)
    return wrapper

# This function is called whenever a protected endpoint is accessed,
# and must return an object based on the tokens identity.
# This is called after the token is verified, so you can use
# get_jwt_claims() in here if desired. Note that this needs to
# return None if the user could not be loaded for any reason,
# such as not being found in the underlying data store


def user_loader_callback(identity):
    return db.session.query(User).get(identity)
    # return User.query.filter_by(username=identity).first()

# Create a function that will be called whenever create_access_token
# is used. It will take whatever object is passed into the
# create_access_token method, and lets us define what the identity
# of the access token should be.


def user_identity_lookup(user):
    return int(user.id)

# Create a function that will be called whenever create_access_token
# is used. It will take whatever object is passed into the
# create_access_token method, and lets us define what custom claims
# should be added to the access token.


def add_claims_to_access_token(user):
    return {'roles': user.roles}


# AUTH routes
auth = Blueprint('auth', __name__)

def login_user(user):
    ''' Logs a user and returns their tokens
    '''

    # Create the tokens we will be sending back to the user
    access_token = create_access_token(identity=user)
    refresh_token = create_refresh_token(identity=user)

    res = jsonify({
        'id': user.id,
        'username': user.username,
        'roles': user.roles
    })
    set_access_cookies(res, access_token)
    set_refresh_cookies(res, refresh_token)
    return res, 200


@auth.route('/login-password', methods=['POST'])
def login_password():
    username = request.json.get('username', None)
    password = request.json.get('password', None)

    if username is None or password is None:
        return jsonify({"msg": "Bad username or password"}), 401

    user = User.query.filter_by(username=username).first()
    if user is None:
        return jsonify({"msg": "Bad username or password"}), 401

    password_providers = [prov for prov in user.providers if prov.provider_id == 'password']
    if len(password_providers) != 1:
        return jsonify({"msg": "Bad username or password"}), 401
    
    provider = password_providers[0]

    if provider.extra['password'] != password_hash(password).hex():
        return jsonify({"msg": "Bad username or password"}), 401

    return login_user(provider.user)


@auth.route('/login-google', methods=['POST'])
def login_google():
    token = request.json.get('token', None)

    if token is None:
        return jsonify({"msg": "Missing auth token"}), 401

    try:
        # Specify the CLIENT_ID of the app that accesses the backend:
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), app.config.get('GOOGLE_CLIENT_ID', None))

        # ID token is valid. Get the user's Google Account ID from the decoded token.
        userid = idinfo['sub']
    except ValueError:
        # Invalid token
        return jsonify({"msg": "Invalid auth token"}), 401

    provider = AuthProvider.query.filter_by(
        user_id=userid, provider_id='google').first()

    if provider is None:
        # create the new user
        user = User(userid, roles=['user'])
        user.add_provider('google', userid)
        db.session.add(user)
        db.session.commit()
        return login_user(user)
    else:
        return login_user(provider.user)


@auth.route('/signup-password', methods=['POST'])
def signup():
    username = request.json.get('username', None)
    password = request.json.get('password', None)

    if username is None or password is None:
        return jsonify({"msg": "Missing username or password"}), 401

    provider = AuthProvider.query.filter_by(
        user_id=username, provider='password').first()

    if provider is not None:
        return jsonify({"msg": "Username exists"}), 401

    # Create the new user
    user = User(username, roles=['user'])
    user.add_provider('password', username, {'password': password})
    return login_user(user)



@auth.route('/refresh', methods=['POST'])
@jwt_refresh_token_required
def refresh():
    user = get_current_user()
    access_token = create_access_token(identity=user)
    res = jsonify({'username': user.username})
    set_access_cookies(res, access_token)
    return res, 200


@auth.route('/logout', methods=['POST'])
def logout():
    res = jsonify({'success': True})
    unset_jwt_cookies(res)
    return res, 200



# USER MANAGEMENT
@auth.route('/users/<uid>/delete')
@admin_required
def user_delete(uid):
    # Get the new user
    user = db.session.query(User).get(bytes.fromhex(uid))
    if user is None:
        return jsonify({'msg': 'invalid user'}), 400
    db.session.delete(user)
    db.session.commit()
    return jsonify({'success': True}), 200