# gunicorn

# Apache mod_wsgi

```
import sys
import os
sys.stdout = sys.stderr
activate_this = '/home/jose/.virtualenvs/covfee/bin/activate_this.py'
with open(activate_this) as file_:
    exec(file_.read(), dict(__file__=activate_this))
os.chdir('/home/jose/conflab-pilot')
from covfee.start import create_app
application = create_app()
```

```
# covfee configuration
Alias /covfee-static /home/jose/covfee/covfee/static
<Directory /home/jose/covfee/covfee/static>
    Require all granted
</Directory>

# conflab pilot
WSGIDaemonProcess conflab user=jose group=jose threads=3
WSGIProcessGroup conflab
WSGIScriptAlias /conflab /home/jose/conflab-pilot/covfee.wsgi
Alias /conflab-media /home/jose/conflab-pilot/media
<Directory /home/jose/conflab-pilot>
    Require all granted
</Directory>
```