from setuptools.command.build_py import build_py
from setuptools.command.install import install
from setuptools.command.develop import develop
from setuptools import find_packages, setup

with open("README.md", "r") as fh:
    long_description = fh.read()

class Install(install):
    def run(self):
        import subprocess
        subprocess.check_call(['npm', 'install', '--prefix', 'covfee'])
        subprocess.check_call(['./node_modules/.bin/webpack', '-p'])
        install.run(self)


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
    cmdclass={
        'install': Install,
        'develop': Develop
    },
    scripts=['./covfee-dev', './covfee-prod', './covfee/utils/mkcovfee'],
    entry_points={
        'console_scripts': [
            'covfee-webpack = covfee.webpack_wrapper:start',
            'covfee-build = covfee.webpack_wrapper:build',
            'covfee-env-production = covfee.webpack_wrapper:set_env_prod',
            'covfee-env-development = covfee.webpack_wrapper:set_env_dev'
        ]
    },
    install_requires=[
        'Flask == 1.*',
        'flask_cors == 3.*',
        'ipywidgets == 7.*',
        'SQLAlchemy == 1.*',
        'Flask-SQLAlchemy == 2.*',
        'gunicorn == 20.*'
    ],
    python_requires='>=3.6'
)
