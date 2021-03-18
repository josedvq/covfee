import os
from pathlib import Path

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
    
