import json
import os
import glob
from hashlib import sha256
from functools import wraps

from flask import Flask, Response, render_template, request, jsonify, Blueprint, send_from_directory
from flask_cors import cross_origin, CORS
from flask_jwt_extended import (
    JWTManager, jwt_required, create_access_token, create_refresh_token, get_current_user,
    set_access_cookies, set_refresh_cookies, jwt_refresh_token_required, unset_jwt_cookies,
    get_jwt_identity, get_jwt_claims, verify_jwt_in_request
)

from covfee.orm import app, db, Project, Timeline, Task, Chunk, User

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
frontend = Blueprint('frontend', __name__)
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
        bundle_url=app.config['BUNDLE_URL'])

@frontend.route('/static/<path:filename>')
def static_file(filename):
    return send_from_directory(app.config['STATIC_PATH'], filename,
                            conditional=True)

@frontend.route('/media/<path:filename>')
def media_file(filename):
    print(app.config['MEDIA_PATH'])
    return send_from_directory(app.config['MEDIA_PATH'], filename,
                               conditional=True)


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
    print((type(user), user))
    access_token = create_access_token(identity=user)
    res = jsonify({'username': user.username})
    set_access_cookies(res, access_token)
    return res, 200

@auth.route('/logout', methods=['POST'])
def logout():
    res = jsonify({'success': True})
    unset_jwt_cookies(res)
    return res, 200

# API ROUTES
api = Blueprint('api', __name__)

@api.route('/projects')
@admin_required
def projects():
    res = db.session.query(Project).all()
    return jsonify([p.as_dict() for p in res])

# returns a project
@api.route('/projects/<pid>')
@admin_required
def project(pid):
    res = db.session.query(Project).get(pid)
    return jsonify(res.as_dict())

# returns a timeline for annotation
@api.route('/timelines/<tid>')
def timeline(tid):
    res = db.session.query(Timeline).get(bytes.fromhex(tid))
    return jsonify(res.as_dict(with_tasks=True))

# timeline completed
@api.route('/timelines/<tid>/submit', methods=['POST'])
def timeline_submit(tid):
    tmln = db.session.query(Timeline).get(bytes.fromhex(tid))
    tmln.submitted = True
    db.session.commit()
    return timeline(tid)

# TASK
# adds a task to a timeline
@api.route('/timelines/<tid>/tasks/add', methods=['POST'])
def task_add(tid):
    timeline = db.session.query(Timeline).get(bytes.fromhex(tid))
    if timeline.type != 'annotator':
        return jsonify(msg='Only annotation-type timelines can be user-edited.'), 403
    task = Task(**request.json)
    timeline.tasks.append(task)
    db.session.commit()
    return jsonify(task.as_dict())

# edits an existing task
@api.route('/timelines/<tid>/tasks/<kid>/edit', methods=['POST'])
def task_edit(tid, kid):
    timeline = db.session.query(Timeline).get(bytes.fromhex(tid))
    if timeline.type != 'annotator':
        return jsonify(msg='Only annotation-type timelines can be user-edited.'), 403
    task = db.session.query(Task).get(int(kid))
    task.name = request.json['name']
    db.session.commit()
    return jsonify(task.as_dict())

# deletes an existing task
@api.route('/timelines/<tid>/tasks/<kid>/delete')
def task_delete(tid, kid):
    timeline = db.session.query(Timeline).get(bytes.fromhex(tid))
    if timeline.type != 'annotator':
        return jsonify(msg='Only annotation-type timelines can be user-edited.'), 403
    task = db.session.query(Task).get(int(kid))
    task.delete()
    db.session.commit()
    return json.dumps({'success': True}), 204

# receives a task answer
@api.route('/timelines/<tid>/tasks/<kid>/submit', methods=['POST'])
def task_submit(tid, kid):
    task = db.session.query(Task).get(int(kid))
    task.numSubmissions += 1
    task.response = request.json
    db.session.commit()
    return jsonify(task.as_dict())

# CHUNK
# receives a chunk of user interaction data
@api.route('/timelines/<tid>/tasks/<kid>/chunk', methods=['POST'])
def chunk(tid, kid):
    task = db.session.query(Task).get(int(kid))
    chunk = Chunk(**request.json)
    task.chunks.append(chunk)
    db.session.commit()
    return jsonify({'msg': "Stored successfully"}), 201

if __name__ == '__main__':
    myapp = create_app()
    myapp.run(processes=3)
