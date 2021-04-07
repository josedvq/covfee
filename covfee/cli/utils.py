import os
from pathlib import Path
import contextlib
from shutil import which


class NPMPackage:
    def __init__(self, path):
        self.path = path

    def is_npm_available(self):
        return which('npm') is not None

    def is_installed(self):
        return os.path.exists(os.path.join(self.path, 'node_modules'))

    def install(self):
        with working_directory(self.path):
            os.system('npm install')


@contextlib.contextmanager
def working_directory(path):
    """Changes working directory and returns to previous on exit."""
    prev_cwd = Path.cwd()
    os.chdir(path)
    try:
        yield
    finally:
        os.chdir(prev_cwd)
