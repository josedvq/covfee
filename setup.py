from setuptools import find_packages, setup

with open("README.md", "r") as fh:
    long_description = fh.read()

setup(
    name='covfee',
    version='0.0.1',
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
            'covfee = covfee.commands:cmd_start_prod',
            'covfee-open = covfee.commands:cmd_open',
            'covfee-maker = covfee.cli.maker:make_db',
            'covfee-filter = covfee.cli.filter:validate',
            'covfee-installjs = covfee.commands:cmd_install_js',
            # for custom deployments (eg. apache_wsgi)
            'covfee-build = covfee.commands:cmd_build',
            # for user management
            'covfee-mkuser = covfee.commands:make_user',
            
            # dev helper scripts
            'covfee-schemata = covfee.cli.filter:cmd_make_schemata',
            'covfee-webpack = covfee.commands:cmd_start_webpack',
            'covfee-dev = covfee.commands:cmd_start_dev',
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
