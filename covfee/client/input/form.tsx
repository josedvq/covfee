import { FormSpec, InputSpec } from "@covfee-shared/spec/form"
import {
  Form as AntdForm,
  Checkbox,
  Input,
  InputNumber,
  Radio,
  Rate,
  Select,
  Slider,
  Switch,
} from "antd"
import * as React from "react"
import { AllPropsRequired } from "../types/utils"
import { log } from "../utils"

const antd_components: { [key: string]: any } = {
  // 'Cascader': Cascader,
  Checkbox: Checkbox,
  "Checkbox.Group": Checkbox.Group,
  // 'DatePicker': DatePicker,
  Input: Input,
  "Input.TextArea": Input.TextArea,
  // 'Input.Password': Input.Password,
  InputNumber: InputNumber,
  "Radio.Group": Radio.Group,
  Rate: Rate,
  Select: Select,
  Slider: Slider,
  Switch: Switch,
  // 'TimePicker': TimePicker,
  // 'TreeSelect': TreeSelect,
}

// interface FieldData {
//     name: string | number | (string | number)[]
//     value?: any
//     touched?: boolean
//     validating?: boolean
//     errors?: string[]
// }

// export type FormState = FieldData[]

interface Props extends FormSpec<InputSpec> {
  /**
   * Stores the form values / answers.
   */
  values: any
  /**
   * Used by the form to update it's values / answers.
   */
  setValues: (arg0: any) => void
  /**
   * Disables the form.
   */
  disabled: boolean
  /**
   * If true, will display a submit button and call onSubmit when pressed
   */
  withSubmitButton: boolean
  /**
   * Renders the submit button for the form
   */
  renderSubmitButton: (arg0?: any) => React.ReactNode
  /**
   * Called with the field values when the form is submitted and validated
   */
  onSubmit?: (arg0: any) => void
}

export const Form: React.FC<React.PropsWithChildren<Props>> = (props) => {
  const args: AllPropsRequired<Props> = {
    disabled: false,
    withSubmitButton: false,
    ...props,
  }

  const formRef = React.useRef()

  const initialValues = React.useMemo(() => {
    let initialValues: { [key: string]: any } = {}
    if (args.values) {
      initialValues = args.values
    } else {
      if (args.fields) {
        initialValues = Object.fromEntries(
          args.fields.map((field) => {
            const defaultValue =
              field.input.defaultValue !== undefined
                ? field.input.defaultValue
                : field.input.defaultChecked !== undefined
                ? field.input.defaultChecked
                : null
            return [field.name, defaultValue]
          })
        )
      }
    }
    return initialValues
  }, [args.fields, args.values])

  const required_fields_filled = () => {
    if (args.fields) {
      if (args.values === null || args.values === undefined) {
        return false
      }
      for (const field of args.fields) {
        if (
          field.required &&
          (args.values[field.name] === null ||
            args.values[field.name] === undefined ||
            !args.values[field.name])
        ) {
          return false
        }
      }
      return true
    } else {
      return true // if no fields or no fields are required, then the form is always valid
    }
  }

  const renderInputElement = (
    inputType: string,
    elementProps: any,
    disabled: boolean
  ) => {
    const elementClass = antd_components[inputType]
    const style: any = {}

    if (inputType == "Slider") {
      style["marginLeft"] = "25"
      style["marginRight"] = "25"
    }

    const elem = React.createElement(
      elementClass,
      {
        ...elementProps,
        disabled: disabled,
        style: style,
      },
      null
    )

    return elem
  }

  const evalCondition = (condition: string) => {
    if (!args.values || !condition) return true

    if (!(condition in args.values)) {
      log.warn(`Unable to resolve condition ${condition}`)
      return true
    }

    return args.values[condition]
  }

  const patchProps = (props: any) => {
    const marks: { [key: string]: React.ReactNode } = {}
    if (props["inputType"] == "Slider" && props["marks"]) {
      for (const [key, value] of Object.entries(props["marks"])) {
        marks[key] = (
          <div
            style={{
              display: "table-caption",
              wordSpacing: "unset",
              fontSize: "0.8em",
            }}
          >
            {value as string}
          </div>
        )
      }
    }
    return { ...props, marks: marks }
  }

  return (
    <AntdForm
      ref={formRef}
      layout={props.layout}
      style={{ margin: "1em" }}
      initialValues={initialValues}
      onValuesChange={(changedValues, allValues) => {
        args.setValues(changedValues)
      }}
      // onFinish={handleFinish}
    >
      {args.fields &&
        args.fields.map((field, index) => {
          // do not render if the condition is not met
          if (!evalCondition(field.condition)) return null

          return (
            <AntdForm.Item
              key={index}
              name={field.name}
              label={field.label}
              required={field.required}
              rules={
                field.required && [
                  { required: true, message: "This field is required." },
                ]
              }
              valuePropName={
                ["Switch", "Checkbox"].includes(field.input.inputType)
                  ? "checked"
                  : "value"
              }
            >
              {(() => {
                if (!(field.input.inputType in antd_components))
                  return <p>Unimplemented input element!</p>

                const elementProps = patchProps({ ...field.input })
                delete elementProps["inputType"]
                delete elementProps["defaultValue"]
                delete elementProps["defaultChecked"]
                return renderInputElement(
                  field.input.inputType,
                  elementProps,
                  args.disabled
                )
              })()}
            </AntdForm.Item>
          )
        })}

      {args.renderSubmitButton && (
        <AntdForm.Item>
          {args.renderSubmitButton({
            disabled: args.disabled || !required_fields_filled(),
          })}
          {/* <Button type="primary" htmlType="submit" disabled={this.props.disabled}>
                  {this.props.submitButtonText}
              </Button>     */}
        </AntdForm.Item>
      )}
    </AntdForm>
  )
}
