from setuptools import find_packages, setup

import versioneer

with open("README.md", "r") as fh:
    long_description = fh.read()

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
        # server stack (fixed versions)
        "Flask == 2.3.2",
        "werkzeug==2.3.4",
        "eventlet==0.35.2",
        "gunicorn == 21.2.0",
        "Flask-Session == 0.5.0",
        "sqlalchemy == 2.0.28",
        "flask_cors == 3.0.10",
        "flask-socketio == 5.3.6",
        "flask-jwt-extended == 4.4.4",
        "pyzmq == 22.3.0",
        "APScheduler == 3.10.4",
        # common utils (fixed major versions)
        "click ==  8.*",
        "numpy == 1.*",
        "pandas == 1.*",
        "requests == 2.*",
        # small utils (fixed versions)
        "jsonschema == 3.2.0",
        "halo == 0.0.31",
        "colorama == 0.4.6",
        "zipstream-new == 1.1.8",
        "pyparsing == 3.1.1",
        "json-ref-dict == 0.7.2",
    ],
    python_requires=">=3.6",
)
