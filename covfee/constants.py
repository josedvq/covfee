import os
import constants_dev
import constants_prod

def get_constants():
    if os.environ['COVFEE_ENV'] == 'production':
        return constants_prod
    else:
        return constants_dev
