import os
import json
from typing import List

import pandas as pd

from hit import HIT

class Project:

    def __init__(self, name = 'Sample', email = 'example@example.com', hits: List[HIT] = []):
        self.name = name
        self.email = email
        self.hits = hits

    @property
    def name(self):
        return self.__name

    @name.setter
    def name(self, val):
        self.__name = val

    @property
    def email(self):
        return self.__email

    @email.setter
    def email(self, val):
        self.__email = val

    @property
    def hits(self):
        return self.__hits

    @hits.setter
    def hits(self, val):
        self.__hits = val

    def link(self):
        ''' Links self object and its tree to database instances
        '''
        for hit in self.hits:
            hit.link()

    def launch(self):
        pass

    def __repr__(self):
        pass

    def get_dataframe(self):
        list_of_instances = list()
        for hit in self.hits:
            for instance in hit.instances:
                list_of_instances.append({
                    'hit_name': hit.name,
                    'id': instance.id.hex(),
                    'url': instance.get_url(),
                    'preview_url': instance.get_preview_url(),
                    'completion_code': instance.get_completion_code()
                })
        df = pd.DataFrame(list_of_instances, columns=['hit_name', 'id', 'url', 'preview_url', 'completion_code'])
        
        return df

    @staticmethod
    def from_json(fpath: str):
        '''
        Loads a project into ORM objects from a project json file.
        '''
        with open(fpath, 'r') as f:
            proj_dict = json.load(f)

        return Project(**proj_dict)

    def stream_download(self, z, base_path, submitted_only=True, csv=False):
        for hit in self.hits:
            for instance in hit.instances:
                if submitted_only and not instance.submitted:
                    continue
                yield from instance.stream_download(z, 
                    os.path.join(base_path, instance.id.hex()), 
                    csv=csv)