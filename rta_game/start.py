from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
import json
import os

from flask import Flask, Response, render_template, request, jsonify, Blueprint
from orm import Project, Timeline, Task, Chunk

app = Flask(__name__)
dist_url = 'http://localhost:8080'

engine = create_engine('sqlite:///database.db', echo=True)
Session = sessionmaker(bind=engine)
session = Session()



# APP ROUTES
@app.route('/')
def main():
    return render_template('app.html', dist_url=dist_url)

# API ROUTES

api = Blueprint('api', __name__)
@api.route('/projects')
def projects():
    res = session.query(Project).all()
    print(res)
    return jsonify([p.as_dict() for p in res])

# returns a timeline for annotation
@api.route('/projects/<pid>')
def project(pid):
    res = session.query(Project).get(pid)
    return jsonify(res.as_dict())

# returns a timeline for annotation
@api.route('/timelines/<tid>')
def timeline(tid):
    res = session.query(Timeline).get(tid)
    return jsonify(res.as_dict(with_tasks=True))

# receives a task answer
@api.route('/timelines/<tid>/tasks/<kid>/submit', methods=['POST'])
def submit(tid, kid):
    fname = f'{tid}_{id}'
    fpath = os.path.join(responses_path, fname)
    with open(fpath, 'w') as fh:
        json.dump(request.json, fh)

# receives a chunk of keystrokes
@api.route('/timelines/<tid>/tasks/<kid>/chunk', methods=['POST'])
def chunk(tid, kid):
    return project['tasks'][tid]


app.register_blueprint(api, url_prefix='/api')

if __name__ == '__main__':
    app.run(threaded=True)
