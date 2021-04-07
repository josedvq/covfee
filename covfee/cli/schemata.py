import os
import json
from collections import Counter

from flask import current_app as app
from covfee.cli.utils import working_directory


class Schemata:
    def __init__(self, with_discriminators=True):
        self.schemata = None
        self.with_discriminators = with_discriminators

        if self.with_discriminators:
            self.schemata_path = app.config['FILTER_SCHEMATA_PATH']
        else:
            self.schemata_path = app.config["DOCS_SCHEMATA_PATH"]

    def exists(self):
        return os.path.exists(self.schemata_path)

    def get(self):
        if self.schemata is not None:
            return self.schemata

        if self.exists():
            self.schemata = json.load(open(self.schemata_path))
            return self.schemata

        self.make()
        return self.schemata

    def make(self):
        # make the typescript into json schemata
        with working_directory(app.config['SHARED_PATH']):
            os.system('npx typescript-json-schema tsconfig.json "*" --titles '
                      f'--ignoreErrors --required -o {app.config["DOCS_SCHEMATA_PATH"]}')

        # process the schemata for validation
        self.schemata = json.load(open(app.config["DOCS_SCHEMATA_PATH"]))

        if self.with_discriminators:
            self.schemata['definitions'] = {
                k: self.add_discriminators(d)
                for k, d in self.schemata['definitions'].items()}
            json.dump(self.schemata, open(
                app.config['FILTER_SCHEMATA_PATH'], 'w'), indent=2)

    def get_ref(self, ref):
        return self.schemata['definitions'][ref[14:]]

    def add_discriminators(self, definition):

        def resolve(node):
            # Returns a list of the resolved children nodes of a node up to nodes with properties

            if '$ref' in node:
                return resolve(self.get_ref(node['$ref']))

            if 'anyOf' in node:
                return [e for n in node['anyOf'] for e in resolve(n)]

            return [node]

        # look for a const property with a default value
        def get_default_const_property(node):
            for k, n in node['properties'].items():
                if 'default' in n and 'enum' in n and len(n['enum']) == 1 and n['default'] == n['enum'][0]:
                    return k

            return False

        # returns a node with cases of anyOf with conditional property transformed into if then else statements.
        def recursive_dfs(node, path=[]):
            if '$ref' in node:
                return node

            if 'allOf' in node:
                raise 'found allOf in schema.'

            if 'oneOf' in node:
                raise 'found oneOf in node'

            if 'anyOf' in node:
                # resolve children
                children = resolve(node)
                # do children have default const properties?
                children_const_props = [get_default_const_property(c) for c in children]
                most_common, count = Counter(children_const_props).most_common(1)[0]

                if count != len(children_const_props):
                    raise 'found a default const element for some but not all of children nodes'

                if most_common == False:
                    node['anyOf'] = [recursive_dfs(n) for n in node['anyOf']]
                    return node

                pivot_prop = most_common
                # there is a default const property in all children
                # modify the schema accordingly
                node['oneOf'] = children
                del node['anyOf']
                node['discriminator'] = {'propertyName': pivot_prop}
                if 'required' not in node:
                    node['required'] = []
                node['required'].append(pivot_prop)

                return node

            if 'type' not in node:
                raise 'type not found in node'

            if node['type'] == 'object' and 'properties' in node and node['properties']:
                node['properties'] = {
                    k: recursive_dfs(n) for k, n in node['properties'].items()}

            if node['type'] == 'array' and node['items']:
                if type(node['items']) == dict:
                    node['items'] = recursive_dfs(node['items'])
                else:
                    node['items'] = [recursive_dfs(n) for n in node['items']]

            return node

        return recursive_dfs(definition)
