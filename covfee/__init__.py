import eventlet  # type: ignore

# we need to monkey patch the standard library to make it work with eventlet
# Apscheduler timers break without this
eventlet.monkey_patch()
# expose building blocks
from covfee.shared.dataclass import HIT, CovfeeApp, Journey, Project

from . import _version
from .shared import task_dataclasses as tasks

__version__ = _version.get_versions()["version"]
