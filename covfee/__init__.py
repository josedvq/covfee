# expose building blocks
from .shared.dataclass import Project, HIT, Journey
from .shared import task_dataclasses as tasks

from . import _version

__version__ = _version.get_versions()["version"]
