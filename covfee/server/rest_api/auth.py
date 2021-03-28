import os
from functools import wraps

from flask import request, jsonify, Blueprint
from flask_jwt_extended import (
    JWTManager, jwt_required, create_access_token, create_refresh_token, get_current_user,
    set_access_cookies, set_refresh_cookies, jwt_refresh_token_required, unset_jwt_cookies,
    get_jwt_identity, get_jwt_claims, verify_jwt_in_request
)

from ..orm import User
# AUTHENTICATION
# Using the user_claims_loader, we can specify a method that will be
# called when creating access tokens, and add these claims to the said
# token. This method is passed the identity of who the token is being
# created for, and must return data that is json serializable
# Here is a custom decorator that verifies the JWT is present in
# the request, as well as insuring that this user has a role of
# `admin` in the access token
if os.getenv('UNSAFE_MODE_ON', False):
    def admin_required(fn): return fn
else:
    def admin_required(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
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
    return User.query.filter_by(username=identity).first()

# Create a function that will be called whenever create_access_token
# is used. It will take whatever object is passed into the
# create_access_token method, and lets us define what the identity
# of the access token should be.


def user_identity_lookup(user):
    return user.username

# Create a function that will be called whenever create_access_token
# is used. It will take whatever object is passed into the
# create_access_token method, and lets us define what custom claims
# should be added to the access token.


def add_claims_to_access_token(user):
    return {'roles': user.roles}


# AUTH routes
auth = Blueprint('auth', __name__)


@auth.route('/login', methods=['POST'])
def login():
    username = request.json.get('username', None)
    password = request.json.get('password', None)

    if username is None or password is None:
        return jsonify({"msg": "Bad username or password"}), 401

    user = User.query.filter_by(
        username=username, password=User.password_hash(password)).first()

    if user is None:
        return jsonify({"msg": "Bad username or password"}), 401

    # Create the tokens we will be sending back to the user
    access_token = create_access_token(identity=user)
    refresh_token = create_refresh_token(identity=user)

    res = jsonify({
        'username': user.username,
        'roles': user.roles
    })
    set_access_cookies(res, access_token)
    set_refresh_cookies(res, refresh_token)
    return res, 200


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
