import eventlet

eventlet.monkey_patch(thread=True, time=True)
from . import _version
from .shared import task_dataclasses as tasks  # noqa: F401

# expose building blocks
from .shared.dataclass import HIT, Journey, Project  # noqa: F401

__version__ = _version.get_versions()["version"]
