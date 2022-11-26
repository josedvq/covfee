import versioneer
from setuptools import find_packages, setup

with open("README.md", "r") as fh:
    long_description = fh.read()

setup(
    name='covfee',
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
        'console_scripts': [
            # user CLI
            'covfee = covfee.cli.commands.launch:covfee_cli',
            # developer CLI
            'covfee-dev = covfee.cli.commands.dev:covfee_dev_cli'
        ]
    },
    install_requires=[
        'Flask == 2.1.0',
        'werkzeug==2.0.3',
        'MarkupSafe==2.0.1',
        'flask_cors == 3.*',
        'Flask-SQLAlchemy == 2.*',
        'flask-socketio == 5.*',
        'gunicorn == 20.*',
        'flask-jwt-extended == 3.*',
        'click ==  8.*',
        'pandas == 1.*',
        'jsonschema == 3.*',
        'halo == 0.*',
        'colorama == 0.4.*',
        'pyzmq == 22.*',
        'numpy == 1.*',
        'zipstream-new == 1.*',
        'construct == 2.*',
        'google-auth == 2.*'
    ],
    python_requires='>=3.6'
)
