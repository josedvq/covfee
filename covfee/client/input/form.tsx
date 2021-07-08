import * as React from 'react'
import { 
    /*
    Supported input elements
    */
    Cascader,
    Checkbox,
    DatePicker,
    Input,
    InputNumber,
    Radio, 
    Rate,
    Select,
    Slider,
    Switch,
    TimePicker,
    TreeSelect,
    /**
     * Other
     */
    List,
    Form as AntdForm,
    Button
} from 'antd'
import { FieldSpec, FormSpec, InputSpec } from '@covfee-types/tasks/questionnaire'
import { FormInstance } from 'antd/lib/form'
import { ThunderboltFilled } from '@ant-design/icons'

const antd_components: {[key: string]: any} = {
    // 'Cascader': Cascader,
    'Checkbox': Checkbox,
    'Checkbox.Group': Checkbox.Group,
    // 'DatePicker': DatePicker,
    'Input': Input,
    'Input.TextArea': Input.TextArea,
    // 'Input.Password': Input.Password,
    // 'InputNumber': InputNumber,
    'Radio.Group': Radio.Group,
    'Rate': Rate,
    'Select': Select,
    'Slider': Slider,
    'Switch': Switch,
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
    onSubmit: (arg0: any) => void
}

export class Form extends React.Component<Props> {

    formRef = React.createRef<FormInstance>()

    static defaultProps = {
        layout: 'vertical',
        disabled: false,
        withSubmitButton: false
    }

    constructor(props: Props) {
        super(props)

        const initialValues: {[key: string]: any} = {}
        if(props.fields) {
            props.fields.forEach((field, idx) => {
                const initialValue = field.input.defaultValue !== undefined ? field.input.defaultValue : 
                                    field.input.defaultChecked !== undefined ? field.input.defaultChecked : 
                                    null
                initialValues[field.name] = initialValue
            })
            props.setValues(initialValues)
        }
    }

    componentDidMount() {
        // this.formRef.current.resetFields()
    }

    handleFinish = (values: any) => {
        this.props.onSubmit(values)
    }

    renderInputElement = (inputType: string, elementProps: any, disabled: boolean) => {
        const elementClass = antd_components[inputType]
        const elem = React.createElement(elementClass, {
            ...elementProps,
            disabled: disabled
        }, null)

        if(elementProps['inputType'] == 'Slider' && elementProps['vertical']) {
            return <div style={{display: 'inline-block', height: 200, margin: '0 50'}}>
                {elem}
            </div>
        }

        return elem
    }

    evalCondition = (condition: string) => {
        if(!this.props.values || !condition) return true
        
        if(!(condition in this.props.values)) {
            console.warn(`Unable to resolve condition ${condition}`)
            return true
        }

        return this.props.values[condition]
    }

    render() {
        if(!this.props.fields) {return <>Empty form</>}

        return <AntdForm
                ref={this.formRef}
                layout={this.props.layout}
                style={{margin: '0 1em'}}
                initialValues={this.props.values}
                onValuesChange={(changedValues, allValues) => { this.props.setValues(changedValues) }}
                onFinish={this.handleFinish}>
                
            {this.props.fields.map((field, index) => {
                return <AntdForm.Item 
                    key={index}
                    name={field.name}
                    label={field.label}
                    required={field.required}
                    rules={field.required && [{required: true, message: 'This field is required.'}]}
                    valuePropName={['Switch', 'Checkbox'].includes(field.input.inputType) ? 'checked' : 'value'}>
                    {(()=>{
                        if(!(field.input.inputType in antd_components))
                            return <p>Unimplemented input element!</p>
            
                        const elementProps = {...field.input}
                        delete elementProps['inputType']
                        return this.renderInputElement(field.input.inputType, elementProps, this.props.disabled || !this.evalCondition(field.condition))
                    })()}
                    
                </AntdForm.Item>
            })}

            {this.props.renderSubmitButton &&
            <AntdForm.Item >
                {this.props.renderSubmitButton()}
                {/* <Button type="primary" htmlType="submit" disabled={this.props.disabled}>
                    {this.props.submitButtonText}
                </Button>     */}
            </AntdForm.Item>}
        </AntdForm>
    }
}
