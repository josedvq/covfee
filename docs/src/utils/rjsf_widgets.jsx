import * as React from 'react'
import { Checkbox } from 'antd'
import {
  utils as rjsfUtils
} from "@rjsf/core";

const {
  asNumber,
  guessType,
  schemaRequiresTrueValue
} = rjsfUtils

const nums = new Set(["number", "integer"]);

/**
 * This is a silly limitation in the DOM where option change event values are
 * always retrieved as strings.
 */
function processValue(schema, value) {
  // "enum" is a reserved word, so only "type" and "items" can be destructured
  const { type, items } = schema;
  if (value === "") {
    return undefined;
  } else if (type === "array" && items && nums.has(items.type)) {
    return value.map(asNumber);
  } else if (type === "boolean") {
    return value === "true";
  } else if (type === "number") {
    return asNumber(value);
  }

  // If type is undefined, but an enum is present, try and infer the type from
  // the enum values
  if (schema.enum) {
    if (schema.enum.every(x => guessType(x) === "number")) {
      return asNumber(value);
    } else if (schema.enum.every(x => guessType(x) === "boolean")) {
      return value === "true";
    }
  }

  return value;
}

function getValue(event, multiple) {
  if (multiple) {
    return [].slice
      .call(event.target.options)
      .filter(o => o.selected)
      .map(o => o.value);
  } else {
    return event.target.value;
  }
}

export function SelectWidget(props) {
  const {
    schema,
    id,
    options,
    value,
    required,
    disabled,
    readonly,
    multiple,
    autofocus,
    onChange,
    onBlur,
    onFocus,
    placeholder,
  } = props;
  const { enumOptions, enumDisabled } = options;
  const emptyValue = multiple ? [] : "";

  if(enumOptions.length === 1) {
    return <>{enumOptions[0].label}</>
  }

  return (
    <select
      id={id}
      multiple={multiple}
      className="form-control"
      value={typeof value === "undefined" ? emptyValue : value}
      required={required}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      onBlur={
        onBlur &&
        (event => {
          const newValue = getValue(event, multiple);
          onBlur(id, processValue(schema, newValue));
        })
      }
      onFocus={
        onFocus &&
        (event => {
          const newValue = getValue(event, multiple);
          onFocus(id, processValue(schema, newValue));
        })
      }
      onChange={event => {
        const newValue = getValue(event, multiple);
        onChange(processValue(schema, newValue));
      }}>
      {!multiple && schema.default === undefined && (
        <option value="">{placeholder}</option>
      )}
      {enumOptions.map(({ value, label }, i) => {
        const disabled = enumDisabled && enumDisabled.indexOf(value) != -1;
        return (
          <option key={i} value={value} disabled={disabled}>
            {label}
          </option>
        );
      })}
    </select>
  );
}



export function CheckboxWidget(props) {
  const {
    schema,
    id,
    value,
    disabled,
    readonly,
    label,
    autofocus,
    onBlur,
    onFocus,
    onChange,
    DescriptionField,
  } = props;

  const required = schemaRequiresTrueValue(schema);

    return <Checkbox 
      id={id} 
      checked={typeof value === "undefined" ? false : value}
      required={required} 
      disabled={disabled || readonly} 
      autoFocus={autofocus} 
      onChange={event => onChange(event.target.checked)}
      onBlur={onBlur && (event => onBlur(id, event.target.checked))}
      onFocus={onFocus && (event => onFocus(id, event.target.checked))}/>
}