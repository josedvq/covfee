import eventlet


# we need to monkey patch the standard library to make it work with eventlet
# Apscheduler timers break without this
eventlet.monkey_patch()
from . import _version
from .shared import task_dataclasses as tasks  # noqa: F401

# expose building blocks
from .shared.dataclass import HIT, Journey, Project  # noqa: F401

__version__ = _version.get_versions()["version"]
