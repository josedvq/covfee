import os
from setuptools.command.build_py import build_py
from setuptools.command.install import install
from setuptools.command.develop import develop
from setuptools import find_packages, setup

with open("README.md", "r") as fh:
    long_description = fh.read()


class NPMInstall(build_py):
    def run(self):
        import subprocess
        print('npm install')
        print(os.getcwd())
        subprocess.check_call(['npm', 'install', '--prefix', 'covfee'])
        build_py.run(self)
        print(os.getcwd())

class Install(install):
    def run(self):
        import subprocess
        print('install')
        print(os.getcwd())
        subprocess.check_call(['npm', 'install', '--prefix', 'covfee'])
        install.run(self)
        print(os.getcwd())


class Develop(develop):
    def run(self):
        import subprocess
        subprocess.check_call(['npm', 'install', '--prefix', 'covfee'])
        develop.run(self)

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
            'covfee-installjs = covfee.commands:install_js',
            'covfee-maker = covfee.commands:make_db',
            'covfee-webpack = covfee.commands:webpack',
            'covfee-dev = covfee.commands:start_dev',
            'covfee-prod = covfee.commands:start_prod',
            'covfee-build = covfee.commands:build',
            'covfee-env-production = covfee.commands:set_env_prod',
            'covfee-env-development = covfee.commands:set_env_dev',
            'covfee-mkuser = covfee.commands:make_user'
        ]
    },
    install_requires=[
        'Flask == 1.*',
        'flask_cors == 3.*',
        'Flask-SQLAlchemy == 2.*',
        'gunicorn == 20.*',
        'flask-jwt-extended == 3.*',
        'click ==  7.*',
        'pandas == 1.*'
    ],
    python_requires='>=3.6'
)
