import json

SCHEMA_TYPE_TO_ANNOT = {
    "string": "str",
    "number": "float",
    "integer": "int",
    "boolean": "bool",
}

NEWL = "\n"
TAB = "    "


def tab(num_tabs, lines):
    return [TAB * num_tabs + l for i, l in enumerate(lines)]


class DataclassMaker:
    """Makes custom dataclasses from JSON schemata
    - This is a rushed implementation; probably does not comply with JSON schema fully.
    """

    def __init__(self, definitions):
        self.definitions = definitions

    def deref(self, prop):
        if "$ref" not in prop:
            return prop
        name = prop["$ref"].split("/")[-1]
        return self.definitions[name]

    def make_import_stmts(self):
        return [
            "from typing import Union, Any, List, Tuple, Dict",
            "from .dataclass import CovfeeTask",
        ]

    def is_constant(self, prop):
        if "enum" in prop and len(prop["enum"]) == 1:
            return True
        return False

    def get_constant(self, prop):
        if prop["type"] == "string":
            return f'"{prop["enum"][0]}"'
        return prop["enum"][0]

    def get_type_annotation(self, prop):
        prop = self.deref(prop)
        if "anyOf" in prop:
            return f'Union[{",".join([self.get_type_annotation(p) for p in prop["anyOf"]])}]'
        if "oneOf" in prop:
            return f'Union[{",".join([self.get_type_annotation(p) for p in prop["oneOf"]])}]'

        if prop["type"] == "null":
            print("Type null found in schema")

        if prop["type"] in ["string", "number", "integer", "boolean"]:
            return SCHEMA_TYPE_TO_ANNOT[prop["type"]]

        if prop["type"] == "array":
            if isinstance(prop["items"], list):
                # this is a tuple, such as:
                #   "items": [
                #     {
                #     "type": "string"
                #     },
                #     {
                #     "type": "string"
                #     }
                #   ]
                items = [self.get_type_annotation(item) for item in prop["items"]]
                return f'Tuple[{",".join(items)}]'
            else:
                return f'List[{self.get_type_annotation(prop["items"])}]'
        return "Any"

    def make_prop_declaration(self, prop):
        name = prop["title"]
        description = prop.get("description", None)
        annot = self.get_type_annotation(prop)

        lines_description = (
            ["# " + line.strip() for line in description.split(NEWL)]
            if description is not None
            else []
        )

        declaration = f"{name}: {annot}"

        if self.is_constant(prop):
            declaration += f" = {self.get_constant(prop)}"
        return [*lines_description, declaration]

    def make_param_docstring(self, i, prop):
        s = [f'{i}. {prop["title"]} : {self.get_type_annotation(prop)}']
        if "description" in prop:
            s += [f'    - {prop["description"]}']
        return s

    def make_docstring(self, description, props):
        params = [self.make_param_docstring(i, p) for i, p in enumerate(props)]
        params = [e for p in params for e in p]
        return [f'"""{description}', "### Parameters", *params, '"""']

    def sort_props(self, props, required_props):
        props_const = [p for p in props if self.is_constant(p)]
        props_nonconst = [p for p in props if not self.is_constant(p)]
        props_without_defaults = [
            p for p in props_nonconst if p["title"] in required_props
        ]
        props_with_defaults = [
            p for p in props_nonconst if p["title"] not in required_props
        ]

        props_without_defaults = sorted(
            props_without_defaults, key=lambda x: x["title"]
        )
        props_with_defaults = sorted(props_with_defaults, key=lambda x: x["title"])

        return props_const, props_without_defaults, props_with_defaults

    def get_default_value(self, prop):
        if "default" in prop:
            return prop["default"]
        else:
            return None

    def make_dataclass(self, schema, definitions):
        props = list(schema["properties"].values())
        # props = [self.deref(prop) for prop in props]
        class_name = schema["title"]
        required_props = schema["required"]
        description = schema.get("description", "")

        props_const, props_without_defaults, props_with_defaults = self.sort_props(
            props, required_props
        )
        all_props = props_const + props_without_defaults + props_with_defaults
        constructor_props = props_without_defaults + props_with_defaults

        arglist = [f'{prop["title"]}' for prop in props_without_defaults]
        arglist += [
            f'{prop["title"]} = {self.get_default_value(prop)}'
            for prop in props_with_defaults
        ]

        prop_assignments = [
            f'self.{prop["title"]} = {prop["title"]}' for prop in constructor_props
        ]
        prop_declarations = []
        for prop in all_props:
            try:
                prop_declarations += self.make_prop_declaration(prop)
            except Exception as ex:
                print("Error making declaration for prop:")
                print(json.dumps(prop, indent=2))
                raise ex

        return [
            f"class {class_name}(CovfeeTask):",
            *tab(1, prop_declarations),
            *tab(1, [f'def __init__(self, {", ".join(arglist)}):']),
            *tab(2, self.make_docstring(description, constructor_props)),
            NEWL,
            *tab(2, ["super().__init__()"]),
            *tab(2, prop_assignments),
        ]

    def make_dataclasses_file(self, schemas, definitions):
        dataclasses = []
        for schema in schemas:
            try:
                dataclasses += self.make_dataclass(schema, definitions)
                dataclasses += NEWL
            except Exception as ex:
                print("Error making dataclass for schema:")
                print(json.dumps(schema, indent=2))
                raise ex

        return f"{NEWL.join(self.make_import_stmts())}\n\n{NEWL.join(dataclasses)}"
