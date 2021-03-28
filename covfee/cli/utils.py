import os
from pathlib import Path
import contextlib


@contextlib.contextmanager
def working_directory(path):
    """Changes working directory and returns to previous on exit."""
    prev_cwd = Path.cwd()
    os.chdir(path)
    try:
        yield
    finally:
        os.chdir(prev_cwd)


def look_for_covfee_files(file_or_folder):
    covfee_files = []

    # database exists and tables are created
    if os.path.isdir(file_or_folder):
        for json_path in Path(file_or_folder).rglob('*.covfee.json'):
            covfee_files.append(json_path)
    elif os.path.isfile(file_or_folder):
        covfee_files.append(file_or_folder)
    else:
        return None

    return covfee_files
