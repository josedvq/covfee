import json
import collections
from colorama import init, Fore
init()

class JavascriptError(Exception):
    pass

class ValidationError(Exception):
    '''Tracks and reports JSON schema validation errors.'''

    def __init__(self, message, path=[], instance=None):

        # Call the base class constructor with the parameters it needs
        super().__init__(message)

        self.path = collections.deque()
        if type(path) == collections.deque:
            while True:
                try:
                    self.path.append(path.pop())
                except IndexError:
                    break
        elif type(path) == list:
            for idx in reversed(path):
                self.path.append(idx)

        self.instance = instance

    def append_path(self, *path_segments):
        for seg in reversed(path_segments):
            self.path.append(seg)

    def pop_path(self):
        self.path.pop()

    def get_python_path_string(self):
        '''Returns a string in python object access notation (using []) to the object where the error was generated.'''
        path_string = ''
        while True:
            try:
                path_segment = self.path.pop()
                if path_segment.isnumeric():
                    path_string += f'[{path_segment}]'
                else:
                    path_string += f'["{path_segment}"]'
            except IndexError:
                return path_string

    def prune_pprint(self, data, indent=4, threshold=10):

        def get_pruned(dt):
            if dt == dict:
                return {'$$pruned$$': '$$pruned$$'}, 3
            if dt == list:
                return ['$$pruned$$'], 3
            return '$$pruned$$', 1

        def prune_node(node):
            # get children display len
            if type(node) == dict:
                # approx number of lines that the node takes when printed
                children_display_lengths = []#[prune_node(n) for k,n in node.items()]
                for k,n in node.items():
                    child_len = prune_node(n)
                    if child_len > threshold:
                        node[k], child_len = get_pruned(type(n))
                    children_display_lengths.append(child_len)
                return 2 + sum(children_display_lengths)

            if type(node) == list:
                children_display_lengths = []
                for i, n in enumerate(node):
                    child_len = prune_node(n)
                    if child_len > threshold:
                        node[i], child_len = get_pruned(type(n))
                    children_display_lengths.append(child_len)
                return 2 + sum(children_display_lengths)

            if type(node) in [str, bool, float, int] or node is None:
                return max(1, len(str(node)) / 80)

        prune_node(data)
        printed = json.dumps(data, indent=indent).replace('"$$pruned$$": "$$pruned$$"', '...').replace('"$$pruned$$"', '...')

        return printed



    def print_friendly(self):
        print(f'\nError in project{self.get_python_path_string()} for object: ')
        print(Fore.BLUE+self.prune_pprint(self.instance, indent=4))
        print('Error: '+ Fore.RED+str(self))