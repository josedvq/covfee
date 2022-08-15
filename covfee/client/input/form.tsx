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
import { log } from '../utils'
import { FieldSpec, FormSpec, InputSpec } from '@covfee-types/tasks/questionnaire'
import { FormInstance } from 'antd/lib/form'
import { StarOutlined, ThunderboltFilled } from '@ant-design/icons'

const antd_components: {[key: string]: any} = {
    // 'Cascader': Cascader,
    'Checkbox': Checkbox,
    'Checkbox.Group': Checkbox.Group,
    // 'DatePicker': DatePicker,
    'Input': Input,
    'Input.TextArea': Input.TextArea,
    // 'Input.Password': Input.Password,
    'InputNumber': InputNumber,
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

    initialValues: {[key: string]: any} = {}

    constructor(props: Props) {
        super(props)

        if(this.props.values) {
            this.initialValues = this.props.values
        } else {

            if(props.fields) {
                props.fields.forEach((field, idx) => {
                    const initialValue = field.input.defaultValue !== undefined ? field.input.defaultValue : 
                                        field.input.defaultChecked !== undefined ? field.input.defaultChecked : 
                                        null
                    this.initialValues[field.name] = undefined
                })
            }
        }
        this.props.setValues(this.initialValues)
    }

    componentDidMount() {
        // this.formRef.current.resetFields()
    }

    handleFinish = (values: any) => {
        this.props.onSubmit(values)
    }

    renderInputElement = (inputType: string, elementProps: any, disabled: boolean) => {
        const elementClass = antd_components[inputType]
        const style: any = {}

        if(inputType == 'Slider') {
            style['marginLeft'] = '25'
            style['marginRight'] = '25'
        }

        const elem = React.createElement(elementClass, {
            ...elementProps,
            disabled: disabled,
            style: style
        }, null)

        return elem
    }

    evalCondition = (condition: string) => {
        if(!this.props.values || !condition) return true
        
        if(!(condition in this.props.values)) {
            log.warn(`Unable to resolve condition ${condition}`)
            return true
        }

        return this.props.values[condition]
    }

    patchProps = (props: any) => {
        const marks = {}
        if(props['inputType'] == 'Slider' && props['marks']) {
            for (const [key, value] of Object.entries(props['marks'])) {
                marks[key] = <div style={{display: 'table-caption', wordSpacing: 'unset', fontSize: '0.8em'}}>{value}</div>
            }
        }
        return {...props, marks: marks}
    }

    render() {
        return <AntdForm
                ref={this.formRef}
                layout={this.props.layout}
                style={{margin: '1em'}}
                initialValues={this.initialValues}
                onValuesChange={(changedValues, allValues) => { this.props.setValues(changedValues) }}
                onFinish={this.handleFinish}>
                
            {this.props.fields && this.props.fields.map((field, index) => {
                // do not render if the condition is not met
                if(!this.evalCondition(field.condition)) return null

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
            
                        const elementProps = this.patchProps({...field.input})
                        delete elementProps['inputType']
                        delete elementProps['defaultValue']
                        delete elementProps['defaultChecked']
                        return this.renderInputElement(field.input.inputType, elementProps, this.props.disabled)
                    })()}
                    
                </AntdForm.Item>
            })}

            {this.props.renderSubmitButton &&
            <AntdForm.Item >
                {this.props.renderSubmitButton({disabled: this.props.disabled})}
                {/* <Button type="primary" htmlType="submit" disabled={this.props.disabled}>
                    {this.props.submitButtonText}
                </Button>     */}
            </AntdForm.Item>}
        </AntdForm>
    }
}
