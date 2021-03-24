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
} from 'antd'

const antd_components = {
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

interface FormProps {
    /**
     * Specification of the form fiels
     */
    fields: Array<any>
    /**
     * Stores the form values / answers.
     */
    values: Array<any>
    /**
     * Used by the form to update it's values / answers.
     */
    setValues: Function
    /**
     * Disables the form.
     */
    disabled: boolean
}
export class Form extends React.Component<FormProps> {

    static defaultProps = {
        disabled: false
    }

    constructor(props: FormProps) {
        super(props)
        this.props.setValues([[]])
    }

    handleChange = (idx: number, fieldset_values: Array<any>) => {
        let values = this.props.values.slice()
        values[idx] = fieldset_values
        this.props.setValues(values)
    }

    render() {
        return <>
            <Fieldset 
                idx={0} 
                disabled={this.props.disabled}
                fields={this.props.fields} 
                values={this.props.values[0]} 
                setValues={this.handleChange}></Fieldset>
            </>
    }
}

interface FieldsetProps {
    /**
     * Index of the fieldset (=key)
     */
    idx: number
    /**
     * Specification of the form fiels
     */
    fields: Array<any>
    /**
     * Stores the fieldset values / answers.
     */
    values: Array<any>
    /**
     * Used by the fieldset to update it's values / answers.
     */
    setValues: Function
    /**
     * Disables the fieldset.
     */
    disabled: boolean

}
class Fieldset extends React.Component<FieldsetProps> {
    componentDidMount() {
        const initial_state = new Array(this.props.fields.length).fill(null);
        this.props.setValues(this.props.idx, initial_state)
    }

    handleChange = (idx: number, new_val: any) => {
        let new_state = this.props.values.slice()
        new_state[idx] = new_val
        this.props.setValues(this.props.idx, new_state)
    }

    render() {
        const elems = []
        for (const [index, spec] of this.props.fields.entries()) {
            elems.push(<Field 
                key={index} 
                idx={index}
                disabled={this.props.disabled}
                value={this.props.values[index]} 
                setValues={this.handleChange}
                {...spec}></Field>)
        }
        return <>
            <List itemLayout='vertical'>
                {elems}
            </List>
        </>
    }
}

interface FieldProps {
    /**
     * Index of the fieldset (=key)
     */
    idx: number

    /**
     * Question or label of the input field
     */
    prompt: string

    /**
     * Specification of the field
     */
    input: any

    /**
     * Stores the field values / answer.
     */
    value: any

    /**
     * Used by the fieldset to update it's values / answers.
     */
    setValues: Function

    /**
     * Disables the fieldset.
     */
    disabled: boolean
}
class Field extends React.Component<FieldProps> {
    handleChange = (e: any) => {
        // components passing event objects to onChange
        if (['Input', 'Radio.Group'].includes(this.props.input.inputType)) {
            this.props.setValues(this.props.idx, e.target.value)
        // the rest pass values directly
        } else if (Object.keys(antd_components).includes(this.props.input.inputType)) {
            this.props.setValues(this.props.idx, e)
        } else {
            console.log('Unrecognized argument type to callback')
        }
    }

    render() {
        let prompt = <p>{this.props.prompt}</p>
        let input

        if(!(this.props.input.inputType in antd_components)) {
            input = <p>Unimplemented input element!</p>
        } else {
            const elementClass = antd_components[this.props.input.inputType]
            input = React.createElement(elementClass, {
                ...this.props.input,
                value: this.props.value,
                disabled: this.props.disabled,
                onChange: this.handleChange,
                optionType: 'button'
            }, null)
        }

        return <List.Item>{prompt}{input}</List.Item>
    }
}