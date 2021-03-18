import os
import sys
import click
import json
from jsonschema import validate

from .utils import look_for_covfee_files

@click.command()
@click.option("--output", '-o', help="Write filtered .covfee.json to a new file.")
@click.argument("file_or_folder")
def filter(file_or_folder, output):
    covfee_path = os.path.dirname(os.path.realpath(__file__))
    schemata_path = os.path.join(covfee_path, '../shared/schema.json')
    with open(schemata_path) as f:
        schemata = json.load(f)

    covfee_files = look_for_covfee_files(file_or_folder)

    if covfee_files is None:
        print(f'Path {file_or_folder} does not point to a file or folder.')
        sys.exit(0)

    for cf in covfee_files:
        with open(cf) as f:
            project_spec = json.load(f)
        
        print(project_spec)
        print(schemata['definitions']['ProjectSpec'])
        print(validate(instance=project_spec,
                       schema=schemata['definitions']['ProjectSpec']))

