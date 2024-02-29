""" Launch commands

These commands meant as development tools only
"""

import os
import click

from flask import current_app as app
from halo.halo import Halo

from covfee.cli.utils import working_directory
from covfee.shared.schemata import Schemata
from covfee.config import config


@click.group(name="covfee-dev")
def covfee_dev_cli():
    pass


@covfee_dev_cli.command(name="build")
def build_master():
    """
    Builds the master (without custom tasks) for distribution.
    """
    config.load_environment("dev")
    bundle_path = config["MASTER_BUNDLE_PATH"]
    with working_directory(config["COVFEE_CLIENT_PATH"]):
        os.system(
            "npx webpack"
            + " --config ./webpack.prod.js"
            + " --output-path "
            + bundle_path
        )


@covfee_dev_cli.command(name="schemata")
def make_schemata():
    with Halo(text="Making schemata", spinner="dots") as spinner:
        schema = Schemata()
        schema.make()
        schema.make_dataclasses()
        spinner.succeed("Schemata made.")


if __name__ == "__main__":
    import sys

    # The following code is intended to run a specific covfee command, such as "build"
    # from the command line, so it is configurable with a debugger (like in VSCode).
    # For example, running `python dev.py --debug-covfee-command build <args>`
    DEBUG_COMMAND: str = "--debug-covfee-command"
    if DEBUG_COMMAND in sys.argv:
        debug_command_index = sys.argv.index(DEBUG_COMMAND) + 1
        if debug_command_index < len(sys.argv):
            debug_command = sys.argv[debug_command_index]
            # Note: covfee uses "click" to parse command line parameters. We remove
            #       DEBUG_COMMAND, which is not recognized by either of the available
            #       covfee functions.
            sys.argv.pop(debug_command_index)
            sys.argv.remove(DEBUG_COMMAND)
            if debug_command == "schemata":
                make_schemata()
            elif debug_command == "build":
                build_master()
