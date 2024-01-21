import logging
import sys
from pprint import pformat

logger = logging.getLogger()
logger.setLevel(logging.DEBUG)

# Create handlers
stdout_handler = logging.StreamHandler(sys.stdout)
stdout_handler.setLevel(logging.DEBUG)

# formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
# stdout_handler.setFormatter(formatter)

# Add handlers to the logger
logger.addHandler(stdout_handler)
