from typing import Dict
from pyparsing import (
    Word,
    alphas,
    nums,
    Forward,
    infixNotation,
    opAssoc,
    CaselessKeyword,
    one_of,
    oneOf,
)

# Define basic elements (operands)
identifier = oneOf(["NOW", "N", "NJOURNEYS"], caseless=True)
number = Word(nums)
operand = identifier | number

# Define operators
comparison_operator = oneOf("< <= > >=")
and_operator = CaselessKeyword("AND")
or_operator = CaselessKeyword("OR")
not_operator = CaselessKeyword("NOT")

# Grammar definition using infixNotation
expression = infixNotation(
    operand,
    [
        (comparison_operator, 2, opAssoc.LEFT),  # Comparison operators
        (not_operator, 1, opAssoc.RIGHT),  # NOT operator - unary, right associative
        (and_operator, 2, opAssoc.LEFT),  # AND operator
        (or_operator, 2, opAssoc.LEFT),  # OR operator
    ],
)

parse_expression = expression.parseString


def eval_expression(parsed, var_values):
    if isinstance(parsed, str):
        if parsed in var_values:
            return var_values[parsed]
        else:
            # Assume it's a literal number
            return float(parsed)
    else:
        if len(parsed) == 1:
            return eval_expression(parsed[0], var_values)
        elif len(parsed) == 2:
            assert parsed[0] == "NOT"
            return not eval_expression(parsed[1], var_values)
        elif len(parsed) == 3:
            op = parsed[1]
            if op in ["<", "<=", ">", ">="]:
                # Comparison operators
                left = eval_expression(parsed[0], var_values)
                right = eval_expression(parsed[2], var_values)
                return eval(f"{left} {op} {right}")
            elif op in ["AND", "OR"]:
                # Logical operators
                left = eval_expression(parsed[0], var_values)
                right = eval_expression(parsed[2], var_values)
                if op == "AND":
                    return left and right
                elif op == "OR":
                    return left or right
        else:
            raise NotImplementedError()


def eval_string(expression: str, var_values: Dict):
    return eval_expression(parse_expression(expression), var_values)
