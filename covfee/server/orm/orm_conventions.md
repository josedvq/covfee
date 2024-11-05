# ORM conventions

## Style conventions

- Always use type annotations for all attributes, methods, and function parameters.
- Use `from __future__ import annotations` at the beginning of each file to enable postponed evaluation of annotations.

- Use [Annotated Declarative Syntax](https://docs.sqlalchemy.org/en/20/orm/declarative_tables.html#using-annotated-declarative-table-type-annotated-forms-for-mapped-column) to specify columns. This has the advantages that the resulting ORM objects have type annotations and everything is very readable. This means:
    - every column should have a `Mapped` type declaration, eg `MyColumn: Mapped[int]`. 
    - use `Optional` to create a nullable column, eg `MyColumn: Mapped[Optional[int]]`
    - use `mapped_column()` on the right hand side if necessary. `mapped_column()` derives the datatype and nullability from the Mapped annotation. mapped_column() is not necessary if there are no additional arguments to pass such as `index`, `unique`, or `default`.
    - specify VARCHAR lenghts on the right, eg. `MyColumn: Mapped[str] = mapped_column(String(64))` will create a `VARCHAR(64)`
    - JSON should be coded as `Mapped[Dict[str,Any]]`
    - ENUM columns should be defined as Python types. The left hand values should match the desired SQL ENUM. The right hand side is not relevant. To create `ENUM('OCT', 'CFI')`:
        ```
        class FeatureModalityEnum(enum.Enum):
            OCT = 1
            CFI = 2
        ```
        Then set up the column as: `MyColumn: Mapped[FeatureModalityEnum]`
- Avoid mixing in other styles like direct column definitions using `Column()`

## Relationships
- To add new relationships, take a look at how they are currently set up in the ORM. For more information refer to the [sqlalchemy docs](https://docs.sqlalchemy.org/en/20/orm/basic_relationships.html).
- classmethods starting with `by_` are selectors. For example, `by_id` will query the database and return an object with the given ID.
- classmethods starting with `from_` are alternative constructors. For example, `from_dict` will construct an object from a dict's properties.
