# gunicorn

# Apache mod_wsgi

```
import sys
import os
os.environ['COVFEE_ENV'] = 'production'
sys.stdout = sys.stderr
activate_this = '/home/XXXX/.virtualenvs/covfee/bin/activate_this.py'
with open(activate_this) as file_:
    exec(file_.read(), dict(__file__=activate_this))
from covfee.start import create_app
application = create_app()
```