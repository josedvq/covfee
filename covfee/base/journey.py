from typing import List

from project import Project
from task import Task
from node import Node
from hit import HIT

class Journey:
    __nodes: List

    def __init__(self, nodes: List):
        self.nodes = nodes

    @property
    def nodes(self):
        return self.__nodes

    @nodes.setter
    def nodes(self, val):
        self.__nodes = val

    def append(self, node: Node):
        self.__nodes.append(node)

    def link(self):
        ''' Links self object and its tree to database instances
        '''
        for journey in self.journeys:
            journey.link()

    def launch(self):
        hit = HIT()
        hit.journeys = [self]
        hit.launch()

    def __repr__(self):
        pass

    