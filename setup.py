from setuptools import find_packages, setup

with open("README.md", "r") as fh:
    long_description = fh.read()

setup(
    name='covfee',
    version='0.0.5',
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
            'covfee = covfee.cli.commands.launch:covfee_cli'
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
        'colorama == 0.3.*',
        'pyzmq == 22.*'
    ],
    python_requires='>=3.6'
)
