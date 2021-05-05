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

const antd_components: {[key: string]: any} = {
    // 'Cascader': Cascader,
    'Checkbox': Checkbox,
    'Checkbox.Group': Checkbox.Group,
    // 'DatePicker': DatePicker,
    'Input': Input,
    // 'Input.TextArea': Input.TextArea,
    // 'Input.Password': Input.Password,
    // 'InputNumber': InputNumber,
    'Radio.Group': Radio.Group,
    // 'Rate': Rate,
    // 'Select': Select,
    'Slider': Slider,
    // 'Switch': Switch,
    // 'TimePicker': TimePicker,
    // 'TreeSelect': TreeSelect,
}

interface FieldData {
    name: string | number | (string | number)[]
    value?: any
    touched?: boolean
    validating?: boolean
    errors?: string[]
}

export type FormState = FieldData[]


interface FormProps extends FormSpec<InputSpec> {
    /**
     * Stores the form values / answers.
     */
    values: FormState
    /**
     * Used by the form to update it's values / answers.
     */
    setValues: (arg0: FormState) => void
    /**
     * Disables the form.
     */
    disabled: boolean
    /**
     * If true, will display a submit button and call onSubmit when pressed
     */
    withSubmitButton: boolean
    /**
     * Called with the field values when the form is submitted and validated
     */
    onSubmit: (arg0: FormState) => void
}




export class Form extends React.Component<FormProps> {

    static defaultProps = {
        layout: 'vertical',
        disabled: false,
        withSubmitButton: false
    }

    constructor(props: FormProps) {
        super(props)
    }

    handleFinish = (values: any) => {
        this.props.onSubmit(values)
    }

    render() {
        return <AntdForm
                fields={this.props.values}
                layout={this.props.layout}
                onFieldsChange={(_, allFields) => { this.props.setValues(allFields) }}
                onFinish={this.handleFinish}>
                
            {this.props.fields && this.props.fields.map((field, index) => {
                return <AntdForm.Item 
                    key={index}
                    name={field.name}
                    label={field.label}
                    required={field.required}
                    rules={field.required && [{required: true, message: 'This field is required.'}]}>
                    
                    {(()=>{
                        if(!(field.input.inputType in antd_components))
                            return <p>Unimplemented input element!</p>
            
                        const elementClass = antd_components[field.input.inputType]
                        const elementProps = {...field.input}
                        delete elementProps['inputType']
                        return React.createElement(elementClass, {
                            ...elementProps,
                            disabled: this.props.disabled
                        }, null)
                    })()}
                    
                </AntdForm.Item>
            })}

            {this.props.withSubmitButton &&
            <AntdForm.Item >
                <Button type="primary" htmlType="submit" disabled={this.props.disabled}>
                    Submit
                </Button>    
            </AntdForm.Item>}
        </AntdForm>
    }
}
