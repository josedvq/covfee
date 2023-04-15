from .base import *
from .project import *
from .hit import *
from .journey import *
from .node import *
from .task import *
from .response import *
from .user import *
# import base
# import project
# import hit
# import journey
# import node
# import task
# import response
# import user


def set_session(session):
    Project.session = session
    HITInstance.session = session
    HITSpec.session = session
    JourneyInstance.session = session
    JourneySpec.session = session
    NodeInstance.session = session
    NodeSpec.session = session
    TaskInstance.session = session
    TaskResponse.session = session
    TaskSpec.session = session
    User.session = session
    AuthProvider.session = session