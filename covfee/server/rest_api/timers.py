from datetime import datetime, timedelta
from flask import (
    current_app as app,
)

from .auth import admin_required

from flask import current_app as app
from .api import api


def task_timer(task_id):
    print("task_timer called")


@api.route("/timers/test")
@admin_required
def timers_test():
    app.scheduler.add_job(
        task_timer, "date", run_date=datetime.now + timedelta(seconds=3)
    )


# return one project
@api.route("/timers/all")
@admin_required
def timers_all(pid):
    pass
