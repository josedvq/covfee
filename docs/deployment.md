
# Deploying covfee

Deploying covfee is only necessary if you want to make your HITs available to others over the internet. We do not recommend developing your tasks in deployment mode. It is normally more convenient to create your HIT specifications locally, deploy covfee, and then run `covfee-maker` on the deployed instance to initialize your database.

## Deployment configuration
covfee reads its configuration from the folder in which it is run (ie. the project folder). When ran in production mode, covfee will look for the file `covfee.production.config.py` for its configuration. 

### Basic configuration

If you are deploying covfee, add a configuration file like the following to your project folder:

```
FLASK_ENV = 'production'

BASE_URL = 'http://example.com/covfee'
APP_PORT = 80
```

The `BASE_URL` option should point to the public URL of your covfee instance.

### Hosting media files externally

To host media files externally, add the following to your `covfee.production.config.py`:

```
MEDIA_URL = 'http://example.com/covfee-media'
MEDIA_SERVER = False
```

The `MEDIA_URL` option allows you to customize the location of your media files. By default, covfee will serve media files from a folder called `media` in your project folder. Anything in this folder will be made public. If you want to host your media files externally, you can disable this behavior by setting `MEDIA_SERVER` to `False` and pointing `MEDIA_URL` to your files' location.

## Deployment options

### gunicorn

gunicorn is the most common deployment option for Flask applications. To run a production copy of covfee on your covfee project directory:

1. Install covfee per the Getting Started instructions. It is recommended to install covfee in a virtual environment.

2. Build covfee. This will build the Javascript bundle used by the covfee app.

```
cd /path/to/covfee-project
covfee-build
```

3. Run the covfee server:

```
covfee-gunicorn
```

### Apache mod_wsgi

covfee can be run under Apache by using [mod_wsgi](https://modwsgi.readthedocs.io/en/master/). `mod_wsgi` must be installed for Python 3 for covfee to work. To ensure this install:

```
sudo apt-get install libapache2-mod-wsgi-py3
```

Next, add a file `covfee.wsgi` with the following to your project directory:

```
import sys
import os
sys.stdout = sys.stderr
activate_this = '/path/to/virtualenv/bin/activate_this.py'
with open(activate_this) as file_:
    exec(file_.read(), dict(__file__=activate_this))
os.chdir('/path/to/covfee-project')
from covfee.start import create_app
application = create_app()
```

This code will allow Apache to create your app instance. `/path/to/virtualenv` is the path to your virtual environment where covfee is installed.

Finally, Apache must know about your site. For this add lines like the following to your apache site configuration:

```
WSGIDaemonProcess covfee user=me group=me threads=3
WSGIProcessGroup covfee
WSGIScriptAlias /covfee /path/to/covfee-project/covfee.wsgi
```

`WSGIScriptAlias` must point to the `covfee.wsgi` file you created in the previous step. The first parameter `/covfee` is the url path under which covfee will be accesible. 

### More deployment options

Covfee is built with Flask and is therefore easy to deploy using any of the options supported by Flask. Take a look at the [Flask deployment options](https://flask.palletsprojects.com/en/1.1.x/deploying/) for more.



