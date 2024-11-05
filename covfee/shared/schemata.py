import json
import os
from collections import Counter

from json_ref_dict import RefDict, materialize

from covfee.cli.utils import working_directory
from covfee.config import config

from .dataclass_maker import DataclassMaker


class Schemata:
    def __init__(self):
        config.load_environment("dev")
        self.schemata = None

    def exists(self):
        return os.path.exists(config["SCHEMATA_PATH"])

    def load(self):
        if self.schemata is not None:
            return self.schemata

        if self.exists():
            self.schemata = json.load(open(config["SCHEMATA_PATH"]))
            return self.schemata
        else:
            self.make()

    def get(self):
        return self.schemata

    def get_definition(self, name: str):
        self.load()
        return self.schemata["definitions"].get(name, None)

    def recursive_resolve_refs(self, definition):
        def resolve(node):
            # Returns a list of the resolved children nodes of a node up to nodes with properties
            if "allOf" in node:
                raise Exception("found allOf in schema.")

            if "oneOf" in node:
                raise Exception("found oneOf in node")

            if "$ref" in node:
                return resolve(self.get_ref(node["$ref"]))

            if "anyOf" in node:
                node["anyOf"] = [resolve(n) for n in node["anyOf"]]
                return node

            if node["type"] == "object" and "properties" in node and node["properties"]:
                node["properties"] = {
                    k: resolve(n) for k, n in node["properties"].items()
                }

            if node["type"] == "array" and node["items"]:
                if type(node["items"]) == dict:
                    node["items"] = resolve(node["items"])
                else:
                    node["items"] = [resolve(n) for n in node["items"]]

            return node

        try:
            return resolve(definition)
        except:
            pass

    def make(self):
        try:
            os.remove(config["SCHEMATA_PATH"])
        except OSError:
            pass
        # make the typescript into json schemata
        with working_directory(config["COVFEE_SHARED_PATH"]):
            tsconfig_path = os.path.join(config["COVFEE_SHARED_PATH"], "tsconfig.json")
            cmd = f'npx typescript-json-schema {tsconfig_path} "MyProjectSpec" --titles --ignoreErrors --required -o {config["SCHEMATA_PATH"]}'
            os.system(cmd)

        # process the schemata for validation
        schemata = json.load(open(config["SCHEMATA_PATH"]))
        defs_only = {
            "$schema": schemata["$schema"],
            "definitions": schemata["definitions"],
        }
        self.schemata = defs_only

        self.schemata["definitions"] = {
            k: self.add_discriminators(d)
            for k, d in self.schemata["definitions"].items()
        }
        json.dump(self.schemata, open(config["SCHEMATA_PATH"], "w"), indent=2)

    def get_ref(self, ref):
        return self.schemata["definitions"][ref[14:]]

    def add_discriminators(self, definition):
        def resolve(node):
            # Returns a list of the resolved children nodes of a node up to nodes with properties
            if "allOf" in node:
                raise Exception("found allOf in schema.")

            if "oneOf" in node:
                raise Exception("found oneOf in node")

            if "$ref" in node:
                return resolve(self.get_ref(node["$ref"]))

            if "anyOf" in node:
                return [e for n in node["anyOf"] for e in resolve(n)]

            return [node]

        # look for a const property with a default value
        def get_default_const_property(node):
            if "properties" in node:
                for k, n in node["properties"].items():
                    if (
                        "default" in n
                        and "enum" in n
                        and len(n["enum"]) == 1
                        and n["default"] == n["enum"][0]
                    ):
                        return k

            return False

        # returns a node with cases of anyOf with conditional property transformed into if then else statements.
        # $refs are resolved to avoid AJV bug: https://github.com/ajv-validator/ajv/pull/1815
        def recursive_dfs(node, path=[]):
            if "$ref" in node:
                return node

            if "anyOf" in node:
                # resolve children
                children = resolve(node)
                # do children have default const properties?
                children_const_props = [get_default_const_property(c) for c in children]
                most_common, count = Counter(children_const_props).most_common(1)[0]

                if count != len(children_const_props):
                    raise "found a default const element for some but not all of children nodes"

                if most_common is False:
                    node["anyOf"] = [recursive_dfs(n) for n in node["anyOf"]]
                    return node

                pivot_prop = most_common
                # there is a default const property in all children
                # modify the schema accordingly
                for child in children:
                    child["additionalProperties"] = False
                node["oneOf"] = node["anyOf"]
                del node["anyOf"]
                node["discriminator"] = {"propertyName": pivot_prop}
                if "required" not in node:
                    node["required"] = []
                node["required"].append(pivot_prop)

                return node

            if (
                node.get("type") == "object"
                and "properties" in node
                and node["properties"]
            ):
                node["properties"] = {
                    k: recursive_dfs(n) for k, n in node["properties"].items()
                }

            if node.get("type") == "array" and node["items"]:
                if type(node["items"]) == dict:
                    node["items"] = recursive_dfs(node["items"])
                else:
                    node["items"] = [recursive_dfs(n) for n in node["items"]]

            return node

        return recursive_dfs(definition)

    def make_dataclasses(self):
        task_specs = [
            sch
            for sch in self.schemata["definitions"].values()
            if sch["title"].endswith("TaskSpec")
            and sch["title"] != 'TaskSpec'
        ]
        definitions = self.schemata["definitions"]

        dm = DataclassMaker(definitions)

        print(json.dumps(task_specs, indent=4))

        # print(task_specs)
        pfile = dm.make_dataclasses_file(task_specs, definitions)

        with open(config["DATACLASSES_PATH"], "w") as f:
            f.write(pfile)


schemata = Schemata()
