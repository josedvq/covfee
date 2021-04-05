import json
import click
from pprint import pprint
from collections import Counter

class SchemataProcessor:
    def __init__(self, schemata):
        self.schemata = schemata

    def get_ref(self,ref):
        return self.schemata['definitions'][ref[14:]]

    def process(self):
        self.schemata['definitions'] = {k: self.make_if_then_else(d) for k, d in self.schemata['definitions'].items()}

    def make_if_then_else(self, definition):

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
                node['properties'] = {k: recursive_dfs(n) for k,n in node['properties'].items()}

            if node['type'] == 'array' and node['items']:
                if type(node['items']) == dict:
                    node['items'] = recursive_dfs(node['items'])
                else:
                    node['items'] = [recursive_dfs(n) for n in node['items']]
                    
            return node

        return recursive_dfs(definition)
            

    def save(self, fh):
        json.dump(self.schemata, fh, indent=2)

@click.command()
@click.argument('input')
@click.argument('output')
def make_json_schema(input, output):
    with open(input) as f:
        schema = SchemataProcessor(json.load(f))
    
    schema.process()
    schema.save(open(output, 'w'))
    
if __name__ == '__main__':
    make_json_schema()