import os
from setuptools.command.build_py import build_py
from setuptools.command.install import install
from setuptools.command.develop import develop
from setuptools import find_packages, setup

with open("README.md", "r") as fh:
    long_description = fh.read()

setup(
    name='covfee',
    version='0.1.0',
    author="Jose Vargas",
    author_email="josedvq@gmail.com",
    description="Continuous video feedback tool",
    long_description=long_description,
    long_description_content_type="text/markdown",
    packages=find_packages(),
    include_package_data=True,
    zip_safe=False,
    entry_points={
        'console_scripts': [
            'covfee-installjs = covfee.commands:cmd_install_js',
            'covfee-maker = covfee.cli.maker:make_db',
            'covfee-filter = covfee.cli.filter:validate',
            'covfee-schemata = covfee.cli.filter:cmd_make_schemata',
            'covfee-update = covfee.commands:update_db',
            'covfee-webpack = covfee.commands:cmd_start_webpack',
            'covfee-dev = covfee.commands:cmd_start_dev',
            'covfee-prod = covfee.commands:cmd_start_prod',
            'covfee-build = covfee.commands:cmd_build',
            'covfee-env-production = covfee.commands:set_env_prod',
            'covfee-env-development = covfee.commands:set_env_dev',
            'covfee-mkuser = covfee.commands:make_user',
            'covfee-open = covfee.commands:cmd_open'
        ]
    },
    install_requires=[
        'Flask == 1.*',
        'flask_cors == 3.*',
        'Flask-SQLAlchemy == 2.*',
        'gunicorn == 20.*',
        'flask-jwt-extended == 3.*',
        'click ==  7.*',
        'pandas == 1.*',
        'jsonschema == 3.*',
        'halo == 0.*',
        'colorama == 0.3.*'
    ],
    python_requires='>=3.6'
)
