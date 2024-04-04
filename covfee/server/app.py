import inspect
import json
import os

from flask import Blueprint, Flask, redirect, request, abort
from flask import current_app as app
from flask import render_template, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_session import Session
from sqlalchemy.orm import scoped_session
from sqlalchemy import select, not_

from covfee.config import Config
from covfee.server import tasks
from covfee.server.tasks.base import BaseCovfeeTask

from .scheduler.apscheduler import scheduler
from .orm.annotator import Annotator
from .orm.journey import JourneyInstance, JourneyInstanceStatus

from datetime import datetime

from typing import Optional


def create_app_and_socketio(mode="deploy", session_local=None):
    # called once per process
    # but reused across threads

    app = Flask(__name__, static_folder=None)

    # load custom config to app.config
    config = Config(mode)
    config.update(app.config)
    app.config = config

    # custom JSON encoding
    from .rest_api.utils import CovfeeJSONProvider

    app.json = CovfeeJSONProvider(app)

    if session_local is None:
        from .db import get_session_local

        session_local = get_session_local(
            in_memory=False, db_path=config["DATABASE_PATH"]
        )

    app.sessionmaker = session_local
    app.session = scoped_session(session_local)

    from .socketio import chat, handlers  # noqa: F401
    from .socketio.socket import socketio

    # important: here, set socketio json implementation too
    socketio.init_app(app, manage_session=True, json=app.json)

    app.register_blueprint(frontend, url_prefix="/")
    from .rest_api import api, auth

    app.register_blueprint(api, url_prefix="/api")
    app.register_blueprint(auth, url_prefix="/auth")

    # register the task blueprints
    for name in dir(tasks):
        elem = getattr(tasks, name)
        if inspect.isclass(elem) and issubclass(elem, BaseCovfeeTask):
            blueprint = elem.get_blueprint()
            if blueprint is not None:
                print(f"Registering blueprint for task {elem.__name__}")
                app.register_blueprint(blueprint, url_prefix=f"/custom/{elem.__name__}")

    CORS(app, resources={r"/*": {"origins": "*"}})
    app.config["SECRET_KEY"] = "Meow Meow"
    app.config["SESSION_PERMANENT"] = False
    app.config["SESSION_TYPE"] = "filesystem"
    Session(app)
    jwt = JWTManager(app)

    from .rest_api import (
        add_claims_to_access_token,
        user_identity_lookup,
        user_loader_callback,
    )

    jwt.additional_claims_loader(add_claims_to_access_token)
    jwt.user_identity_loader(user_identity_lookup)
    jwt.user_lookup_loader(user_loader_callback)

    # APScheduler
    # app.scheduler = BackgroundScheduler()
    scheduler.start()

    @app.teardown_appcontext
    def teardown_appctx(exception):
        app.session.remove()

    return socketio, app


def create_app(*args, **kwargs):
    socketio, app = create_app_and_socketio(*args, **kwargs)
    return app


# APP ROUTES
frontend = Blueprint(
    "frontend",
    __name__,
    template_folder=os.path.join(
        os.path.dirname(os.path.realpath(__file__)), "templates"
    ),
)


# annotation app
@frontend.route("/")
def main():
    return render_template(
        "app.html",
        constants=json.dumps(app.config.get_frontend_config()),
        bundle_url=app.config["BUNDLES_URL"],
    )


# admin interface
@frontend.route("/admin")
def admin():
    return render_template(
        "admin.html",
        constants=json.dumps(app.config.get_frontend_config()),
        bundle_url=app.config["BUNDLES_URL"],
    )


# admin interface
@frontend.route("/prolific")
def prolific():
    # The journey_instance_id to use for redirection
    journey_instance_url: Optional[str] = None

    # We extract the Prolific academic worker unique id
    prolific_project_id = request.args.get("project")
    prolific_annotator_id = request.args.get("annotator")
    if prolific_project_id is None or prolific_annotator_id is None:
        abort(404)

    # We check if an Annotator exists in the database with the given prolific_annotator_id
    session = app.session()
    annotator = session.execute(
        select(Annotator).filter_by(prolific_id=prolific_annotator_id)
    ).scalar_one_or_none()

    if annotator is not None:
        # Annotator already registered, check whether to redirect to their journey_instance work, or
        # to inform them they no longer have access.
        if annotator.journey_instance is not None:
            # Note: consider evaluating expiration here. Access expiration is only evaluated when another
            #       annotator tries to get a journey instance to work on.
            journey_instance_url = annotator.journey_instance.get_url()
        else:
            return render_template(
                "annotator_error.html",
                message="This task can no longer be accessed. Please contact the study coordinator.",
                id=prolific_annotator_id,
            )
    else:
        non_finished_journey_instances_query = session.query(JourneyInstance).filter(
            not_(
                JourneyInstance.status.in_(
                    [JourneyInstanceStatus.FINISHED, JourneyInstanceStatus.DISABLED]
                )
            )
        )
        expired_annotator = None
        # We try to pick a journey_instance that does not have an annotator associated with it
        # in first priority
        for journey_instance in non_finished_journey_instances_query.all():
            # We ignore finished or disabled journeys
            if journey_instance.annotator is None:
                # We take a record of the journey_id for the later redirection
                journey_instance_url = journey_instance.get_url()

                # Then we register an Annotator row and associate it with the journey_instance
                annotator = Annotator(prolific_id=prolific_annotator_id)
                journey_instance.annotator = annotator
                session.add(annotator)
                session.commit()
                break

        if journey_instance_url is None:
            # If we did not find an unassigned journey instance, we check if there is one whose
            # annotator access has timedout, in a second priority
            for journey_instance in non_finished_journey_instances_query.all():
                previous_annotator_access_expired: bool = (
                    journey_instance.annotator is not None
                    and (
                        datetime.now() - journey_instance.annotator.created_at
                    ).total_seconds()
                    > app.config["ANNOTATOR_COMPLETION_TIMEOUT_IN_SECONDS"]
                )
                if journey_instance.annotator is not None:
                    print(
                        "ELAPSED: ",
                        (
                            datetime.now() - journey_instance.annotator.created_at
                        ).total_seconds(),
                    )
                    print(
                        "previous_annotator_access_expired",
                        previous_annotator_access_expired,
                    )
                if previous_annotator_access_expired:
                    # We take a record of the journey_id for the later redirection
                    journey_instance_url = journey_instance.get_url()
                    # We take a record of expired journey instance for the previous annotator
                    # so we can keep track of what happened.
                    expired_annotator = journey_instance.annotator
                    journey_instance.annotator.expired_journey_instance_id = (
                        journey_instance.id
                    )
                    # TODO: Consider "cleaning up" the progress for the journey here.

                    # We now create a new entry for the requesting annotator and assign to this
                    # journey instance
                    annotator = Annotator(prolific_id=prolific_annotator_id)
                    journey_instance.annotator = annotator
                    session.add(annotator)
                    session.commit()
                    print(expired_annotator)
                    break

        if journey_instance_url is None:
            # We should here tell the annotator that all tasks have been taken and send an email or something
            return render_template(
                "annotator_error.html",
                message="No pending tasks available. Please contact the study coordinator.",
                id=prolific_annotator_id,
            )

    # http://localhost:5000/prolific?annotator=annotator1&project=prof
    # http://localhost:5000/prolific?annotator=annotator2&project=prof

    return redirect(journey_instance_url)


# project www server
@frontend.route("/www/<path:filename>")
def project_www_file(filename):
    return send_from_directory(app.config["PROJECT_WWW_PATH"], filename)


@frontend.route("/bundles/<path:filename>")
def bundles(filename):
    return send_from_directory(app.config["MASTER_BUNDLE_PATH"], filename)


@frontend.errorhandler(404)
def page_not_found(e):
    # note that we set the 404 status explicitly
    return render_template("404.html"), 404
