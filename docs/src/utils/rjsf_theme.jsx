import * as React from 'react'
import styled from 'styled-components'
import { Button, Tooltip } from 'antd'
import {InfoCircleOutlined, UpOutlined, DownOutlined, DeleteOutlined, PlusOutlined} from '@ant-design/icons'
import {
    utils as rjsfUtils,
    validate as rjsfValidate
  } from "@rjsf/core";
import './rjsf_theme.css'

const {getUiOptions,
    isObject,
    isSelect,
    isMultiSelect,
    isFilesArray,
    mergeObjects,
    toIdSchema,
    getSchemaType,
    canExpand,
    getWidget,
    guessType,
    retrieveSchema,
    getDefaultFormState,
    schemaRequiresTrueValue,
    deepEquals} = rjsfUtils

function getMatchingOption(formData, options, rootSchema) {
  for (let i = 0; i < options.length; i++) {
    const option = options[i];

    if (option.properties) {
      // check if there are constant properties / discriminator
      for(const [prop, sch] of Object.entries(option.properties)) {
        if(prop in formData && 'enum' in sch && sch.enum.length === 1 && sch.enum[0] === formData[prop]) {
          return i
        }
      }
    }
  }
  return 0;
}

function getDisplayLabel(schema, uiSchema, rootSchema) {
    const uiOptions = getUiOptions(uiSchema);
    let { label: displayLabel = true } = uiOptions;
    const schemaType = getSchemaType(schema);
    
    if (schemaType === "array") {
        displayLabel =
        isMultiSelect(schema, rootSchema) ||
        isFilesArray(schema, uiSchema, rootSchema);
    }
    
    if (schemaType === "object") {
        displayLabel = true;
    }
    if (uiSchema["ui:field"]) {
        displayLabel = false;
    }
    return displayLabel;
}

function ArrayFieldTitle({ TitleField, idSchema, title, required }) {
    if (!title) {
        return null;
    }
    const id = `${idSchema.$id}__title`;
    return <TitleField id={id} title={title} required={required} />;
}

function ArrayFieldDescription({ DescriptionField, idSchema, description }) {
    if (!description) {
      return null;
    }
    const id = `${idSchema.$id}__description`;
    return <DescriptionField id={id} description={description} />;
}

// Used in the two templates
function DefaultArrayItem(props) {
    const btnStyle = {
        flex: 1,
        paddingLeft: 6,
        paddingRight: 6,
        fontWeight: "bold",
    };
    return (
        <div key={props.key} className={props.className} style={{width: '100%'}}>
    
        {props.hasToolbar && (
            <div className="col-xs-3 array-item-toolbox" style={{float: 'right'}}>
            <div
                className="btn-group"
                style={{
                display: "flex",
                justifyContent: "space-around",
                }}>
                {(props.hasMoveUp || props.hasMoveDown) && (
                <Button
                    icon={<UpOutlined />}
                    aria-label="Move up"
                    tabIndex="-1"
                    disabled={props.disabled || props.readonly || !props.hasMoveUp}
                    onClick={props.onReorderClick(props.index, props.index - 1)}
                />
                )}

                {(props.hasMoveUp || props.hasMoveDown) && (
                <Button
                    icon={<DownOutlined />}
                    aria-label="Move down"
                    tabIndex="-1"
                    disabled={
                    props.disabled || props.readonly || !props.hasMoveDown
                    }
                    onClick={props.onReorderClick(props.index, props.index + 1)}
                />
                )}

                {props.hasRemove && (
                <Button
                    type="danger"
                    icon={<DeleteOutlined />}
                    aria-label="Remove"
                    tabIndex="-1"
                    disabled={props.disabled || props.readonly}
                    onClick={props.onDropIndexClick(props.index)}
                />
                )}
            </div>
            </div>
        )}

        <div style={{width: '100%'}}>
            {props.children}
        </div>
        </div>
    );
}

function AddButton(props) {
    return <Button type='primary' shape='circle' disabled={props.disabled} onClick={props.onClick} icon={<PlusOutlined />}></Button>
}

function ArrayFieldTemplate(props) {
    return (<>
        [
        <Indenter>
        

        <div
            className="row array-item-list"
            key={`array-item-list-${props.idSchema.$id}`}>
            {props.items && props.items.map(p => DefaultArrayItem(p))}
        </div>

        {props.canAdd && (
            <AddButton
            className="array-item-add"
            onClick={props.onAddClick}
            disabled={props.disabled || props.readonly}
            />
        )}
        </Indenter>
        ]
        </>
    );
}

const REQUIRED_FIELD_SYMBOL = "*"
function Label(props) {
    const { label, required, id } = props;
    if (!label) {
      return null;
    }
    return (
      <label className="control-label" htmlFor={id}>
        {label}
        {required && <span className="required">{REQUIRED_FIELD_SYMBOL}</span>}
      </label>
    );
}

function FieldTemplate(props) {
    const {
      id,
      label,
      children,
      errors,
      help,
      description,
      rawDescription,
      hidden,
      required,
      displayLabel,
    } = props;
    if (hidden) {
      return <div className="hidden">{children}</div>;
    }

    return (
      <div>
        {displayLabel && ((!!rawDescription) ? <Tooltip placement='leftTop' title={rawDescription}><InfoCircleOutlined /> <Label label={label} required={required} id={id} />: </Tooltip> : 
            <><Label label={label} required={required} id={id}/>: </>)}
        {children}
        {errors}
        {help}
      </div>
    );
}

function ObjectFieldTemplate(props) {
    const { TitleField, DescriptionField } = props
    return <>
        &#123; {props.description && (<Comment> &#8725;&#8725; {props.description}</Comment>)}
        <Indenter>
            {props.properties.map(prop => prop.content)}
        </Indenter>
        
        
        {canExpand(props.schema, props.uiSchema, props.formData) && (
        <AddButton
            className="object-property-expand"
            onClick={props.onAddClick(props.schema)}
            disabled={props.disabled || props.readonly}
        />
        )}
        &#125;
    </>
}

const COMPONENT_TYPES = {
    array: "ArrayField",
    boolean: "BooleanField",
    integer: "NumberField",
    number: "NumberField",
    object: "ObjectField",
    string: "StringField",
    null: "NullField",
  };
  

function getFieldComponent(schema, uiSchema, idSchema, fields) {
    const field = uiSchema["ui:field"];
    if (typeof field === "function") {
      return field;
    }
    if (typeof field === "string" && field in fields) {
      return fields[field];
    }
  
    const componentName = COMPONENT_TYPES[getSchemaType(schema)];
  
    // If the type is not defined and the schema uses 'anyOf' or 'oneOf', don't
    // render a field and let the MultiSchemaField component handle the form display
    if (!componentName && (schema.anyOf || schema.oneOf)) {
      return () => null;
    }
  
    return componentName in fields
      ? fields[componentName]
      : () => {
          const { UnsupportedField } = fields;
  
          return (
            <UnsupportedField
              schema={schema}
              idSchema={idSchema}
              reason={`Unknown field type ${schema.type}`}
            />
          );
        };
  }

  function Help(props) {
    const { id, help } = props;
    if (!help) {
      return null;
    }
    if (typeof help === "string") {
      return (
        <p id={id} className="help-block">
          {help}
        </p>
      );
    }
    return (
      <div id={id} className="help-block">
        {help}
      </div>
    );
  }

  function ErrorList(props) {
    const { errors = [] } = props;
    if (errors.length === 0) {
      return null;
    }
  
    return (
      <div>
        <ul className="error-detail bs-callout bs-callout-info">
          {errors
            .filter(elem => !!elem)
            .map((error, index) => {
              return (
                <li className="text-danger" key={index}>
                  {error}
                </li>
              );
            })}
        </ul>
      </div>
    );
  }

function SchemaFieldRender(props) {
    let {
      uiSchema,
      formData,
      errorSchema,
      idPrefix,
      name,
      onChange,
      onKeyChange,
      onDropPropertyClick,
      required,
      displayLabel,
      registry = getDefaultRegistry(),
      wasPropertyKeyModified = false,
    } = props;
    const { rootSchema, fields, formContext } = registry;
    const FieldTemplate =
      uiSchema["ui:FieldTemplate"] || registry.FieldTemplate || DefaultTemplate;
    let idSchema = props.idSchema;
    const schema = retrieveSchema(props.schema, rootSchema, formData);
    idSchema = mergeObjects(
      toIdSchema(schema, null, rootSchema, formData, idPrefix),
      idSchema
    );
    const FieldComponent = getFieldComponent(schema, uiSchema, idSchema, fields);
    const { DescriptionField } = fields;
    const disabled = Boolean(props.disabled || uiSchema["ui:disabled"]);
    const readonly = Boolean(
      props.readonly ||
        uiSchema["ui:readonly"] ||
        props.schema.readOnly ||
        schema.readOnly
    );
    const autofocus = Boolean(props.autofocus || uiSchema["ui:autofocus"]);
    if (Object.keys(schema).length === 0) {
      return null;
    }
  
    if(displayLabel === undefined)
        displayLabel = getDisplayLabel(schema, uiSchema, rootSchema);
  
    const { __errors, ...fieldErrorSchema } = errorSchema;
  
    // See #439: uiSchema: Don't pass consumed class names to child components
    const field = (
      <FieldComponent
        {...props}
        idSchema={idSchema}
        schema={schema}
        uiSchema={{ ...uiSchema, classNames: undefined }}
        disabled={disabled}
        readonly={readonly}
        autofocus={autofocus}
        errorSchema={fieldErrorSchema}
        formContext={formContext}
        rawErrors={__errors}
      />
    );
  
    const id = idSchema.$id;
  
    // If this schema has a title defined, but the user has set a new key/label, retain their input.
    let label;
    if (wasPropertyKeyModified) {
      label = name;
    } else {
      label = uiSchema["ui:title"] || props.schema.title || schema.title || name;
    }
  
    const description =
      uiSchema["ui:description"] ||
      props.schema.description ||
      schema.description;
    const errors = __errors;
    const help = uiSchema["ui:help"];
    const hidden = uiSchema["ui:widget"] === "hidden";
    const classNames = [
      "form-group",
      "field",
      `field-${schema.type}`,
      errors && errors.length > 0 ? "field-error has-error has-danger" : "",
      uiSchema.classNames,
    ]
      .join(" ")
      .trim();
  
    const fieldProps = {
      description: (
        <DescriptionField
          id={id + "__description"}
          description={description}
          formContext={formContext}
        />
      ),
      rawDescription: description,
      help: <Help id={id + "__help"} help={help} />,
      rawHelp: typeof help === "string" ? help : undefined,
      errors: <ErrorList errors={errors} />,
      rawErrors: errors,
      id,
      label,
      hidden,
      onChange,
      onKeyChange,
      onDropPropertyClick,
      required,
      disabled,
      readonly,
      displayLabel,
      classNames,
      formContext,
      formData,
      fields,
      schema,
      uiSchema,
      registry,
    };
  
    const _AnyOfField = registry.fields.AnyOfField;
    const _OneOfField = registry.fields.OneOfField;

    // return field
  
    return (
      <FieldTemplate {...fieldProps}>
        <React.Fragment>
          {field}
  
          {/*
          If the schema `anyOf` or 'oneOf' can be rendered as a select control, don't
          render the selection and let `StringField` component handle
          rendering
        */}
          {schema.anyOf && !isSelect(schema) && (
            <_AnyOfField
              disabled={disabled}
              errorSchema={errorSchema}
              formData={formData}
              idPrefix={idPrefix}
              idSchema={idSchema}
              onBlur={props.onBlur}
              onChange={props.onChange}
              onFocus={props.onFocus}
              options={schema.anyOf.map(_schema =>
                retrieveSchema(_schema, rootSchema, formData)
              )}
              baseType={schema.type}
              registry={registry}
              schema={schema}
              uiSchema={uiSchema}
            />
          )}
  
          {schema.oneOf && !isSelect(schema) && (
            <_OneOfField
              disabled={disabled}
              errorSchema={errorSchema}
              formData={formData}
              idPrefix={idPrefix}
              idSchema={idSchema}
              onBlur={props.onBlur}
              onChange={props.onChange}
              onFocus={props.onFocus}
              options={schema.oneOf.map(_schema =>
                retrieveSchema(_schema, rootSchema, formData)
              )}
              baseType={schema.type}
              registry={registry}
              schema={schema}
              uiSchema={uiSchema}
            />
          )}
        </React.Fragment>
      </FieldTemplate>
    );
  }
  
  class SchemaField extends React.Component {
    shouldComponentUpdate(nextProps, nextState) {
      return !deepEquals(this.props, nextProps);
    }
  
    render() {
      return SchemaFieldRender(this.props);
    }
  }
  
  SchemaField.defaultProps = {
    uiSchema: {},
    errorSchema: {},
    idSchema: {},
    disabled: false,
    readonly: false,
    autofocus: false,
  };

class AnyOfField extends React.Component {
    constructor(props) {
      super(props);
  
      const { formData, options } = this.props;
  
      this.state = {
        selectedOption: this.getMatchingOption(formData, options),
      };
    }
  
    componentDidUpdate(prevProps, prevState) {
      if (
        !deepEquals(this.props.formData, prevProps.formData) &&
        this.props.idSchema.$id === prevProps.idSchema.$id
      ) {
        const matchingOption = this.getMatchingOption(
          this.props.formData,
          this.props.options
        );
  
        if (!prevState || matchingOption === this.state.selectedOption) {
          return;
        }
  
        this.setState({
          selectedOption: matchingOption,
        });
      }
    }
  
    getMatchingOption(formData, options) {
      const { rootSchema } = this.props.registry;
  
      let option = getMatchingOption(formData, options, rootSchema);

      if (option !== 0) {
        return option;
      }
      // If the form data matches none of the options, use the currently selected
      // option, assuming it's available; otherwise use the first option
      return this && this.state ? this.state.selectedOption : 0;
    }
  
    onOptionChange = option => {
      const selectedOption = parseInt(option, 10);
      const { formData, onChange, options, registry } = this.props;
      const { rootSchema } = registry;
      const newOption = retrieveSchema(
        options[selectedOption],
        rootSchema,
        formData
      );
  
      // If the new option is of type object and the current data is an object,
      // discard properties added using the old option.
      let newFormData = undefined;
      if (
        guessType(formData) === "object" &&
        (newOption.type === "object" || newOption.properties)
      ) {
        newFormData = Object.assign({}, formData);
  
        const optionsToDiscard = options.slice();
        optionsToDiscard.splice(selectedOption, 1);
  
        // Discard any data added using other options
        for (const option of optionsToDiscard) {
          if (option.properties) {
            for (const key in option.properties) {
              if (newFormData.hasOwnProperty(key)) {
                delete newFormData[key];
              }
            }
          }
        }
      }
      // Call getDefaultFormState to make sure defaults are populated on change.
      onChange(
        getDefaultFormState(options[selectedOption], newFormData, rootSchema)
      );
  
      this.setState({
        selectedOption: parseInt(option, 10),
      });
    };
  
    render() {
      const {
        baseType,
        disabled,
        errorSchema,
        formData,
        idPrefix,
        idSchema,
        onBlur,
        onChange,
        onFocus,
        options,
        registry,
        uiSchema,
        schema,
      } = this.props;
  
      const _SchemaField = registry.fields.SchemaField;
      const { widgets } = registry;
      const { selectedOption } = this.state;
      const { widget = "select", ...uiOptions } = getUiOptions(uiSchema);
      const Widget = getWidget({ type: "number" }, widget, widgets);
  
      const option = options[selectedOption] || null;
      let optionSchema;
  
      if (option) {
        // If the subschema doesn't declare a type, infer the type from the
        // parent schema
        optionSchema = option.type
          ? option
          : Object.assign({}, option, { type: baseType });
      }
  
      const enumOptions = options.map((option, index) => ({
        label: option.title || `Option ${index + 1}`,
        value: index,
      }));
  
      return (
        <>
            <Widget
                id={`${idSchema.$id}${
                schema.oneOf ? "__oneof_select" : "__anyof_select"
                }`}
                schema={{ type: "number", default: 0 }}
                onChange={this.onOptionChange}
                onBlur={onBlur}
                onFocus={onFocus}
                value={selectedOption}
                options={{ enumOptions }}
                {...uiOptions}
            />
  
            {option !== null && (
            <_SchemaField
                schema={optionSchema}
                uiSchema={uiSchema}
                displayLabel={false}
                errorSchema={errorSchema}
                idSchema={idSchema}
                idPrefix={idPrefix}
                formData={formData}
                onChange={onChange}
                onBlur={onBlur}
                onFocus={onFocus}
                registry={registry}
                disabled={disabled}
            />
            )}
        </>
      );
    }
  }


import {SelectWidget, CheckboxWidget} from './rjsf_widgets'

export const theme = { widgets: {test: () => (<div>test</div>) },
    FieldTemplate: FieldTemplate,
    ObjectFieldTemplate: ObjectFieldTemplate,
    ArrayFieldTemplate: ArrayFieldTemplate,
    widgets: {
        CheckboxWidget: CheckboxWidget,
        SelectWidget: SelectWidget
    },
    fields: {
        SchemaField: SchemaField,
        AnyOfField: AnyOfField,
        OneOfField: AnyOfField
    }
}


const Indenter = styled.div`
    padding-left: 2em;
`

const Comment = styled.span`
  padding-left: 20px;
  color: #888888;
`