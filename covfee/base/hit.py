from typing import List

from project import Project
from journey import Journey
from covfee.server.orm.hit import HitModel

class HIT:

    def __init__(self, name = 'Sample', journeys: List[Journey] = []):
        self.name = name
        self.journeys = journeys

    @property
    def name(self):
        return self.__name

    @name.setter
    def name(self, val):
        self.__name = val

    @property
    def journeys(self):
        return self.__journeys

    @journeys.setter
    def journeys(self, val):
        self.__journeys = val

    def link(self):
        ''' Links self object and its tree to database instances
        '''
        for journey in self.journeys:
            journey.link()
   
    def launch(self):
        project = Project()
        project.hits = [self]
        project.launch()

    def __repr__(self):
        pass

    def get_api_url(self):
        return f'{app.config["API_URL"]}/hits/{self.id.hex()}'

    def get_generator_url(self):
        ''' URL to the generator endpoint, which will instantiate the HIT and redirect the user to the new instance
        For use in linking from crowdsourcing websites (eg. Prolific)
        '''
        return f'{app.config["API_URL"]}/hits/{self.id.hex():s}/instances/add_and_redirect'