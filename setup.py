import versioneer

from setuptools import find_packages, setup
import sys

with open("README.md", "r") as fh:
    long_description = fh.read()

if not (sys.version_info >= (3, 8) and sys.version_info < (3, 11)):
    sys.exit("Python version must be >=3.8 and < 3.11")

setup(
    name="covfee",
    # using versioneer for versioning using git tags
    # https://github.com/python-versioneer/python-versioneer/blob/master/INSTALL.md
    version=versioneer.get_version(),
    cmdclass=versioneer.get_cmdclass(),
    author="Jose Vargas",
    author_email="josedvq@gmail.com",
    description="Continuous video feedback tool",
    long_description=long_description,
    long_description_content_type="text/markdown",
    packages=find_packages(),
    include_package_data=True,
    zip_safe=False,
    entry_points={
        "console_scripts": [
            # user CLI
            "covfee = covfee.cli.commands.launch:covfee_cli",
            # developer CLI
            "covfee-dev = covfee.cli.commands.dev:covfee_dev_cli",
        ]
    },
    install_requires=[
        "Flask == 2.3.2",
        "werkzeug==2.3.4",
        "eventlet==0.33.3",
        "Flask-Session == 0.5.*",
        "sqlalchemy == 2.*",
        "flask_cors == 3.*",
        "flask-socketio == 5.*",
        "gunicorn == 20.*",
        "flask-jwt-extended == 4.4.4",
        "click ==  8.*",
        "pandas == 1.*",
        "jsonschema == 3.*",
        "halo == 0.*",
        "colorama == 0.4.*",
        "pyzmq == 22.*",
        "numpy == 1.*",
        "zipstream-new == 1.*",
        "requests == 2.*",
        "APScheduler == 3.10.*",
        "pyparsing == 3.1.1",
        "json-ref-dict == 0.7.2",
    ],
    python_requires=">=3.6",
)
