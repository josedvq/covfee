import * as React from 'react'
import { 
    Radio, 
    List
} from 'antd'

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
class Form extends React.Component<FormProps> {

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
        this.props.setValues(this.props.idx, e.target.value)
    }

    render() {
        let prompt = <p>{this.props.prompt}</p>

        let input = null
        switch (this.props.input.type) {
            case 'radio':
                input = <MyRadio 
                    options={this.props.input.options} 
                    value={this.props.value}
                    disabled={this.props.disabled}
                    setValues={this.handleChange}/>
                break
            default:
                input = <p>Unimplemented</p>
        }

        return <List.Item>{prompt}{input}</List.Item>
    }
}

function MyRadio(props) {
    const items = []
    for (const [index, text] of props.options.entries()) {
        items.push(<Radio.Button 
            key={index} 
            value={index}
            onChange={props.setValues}>{text}</Radio.Button>)
    }
    return <Radio.Group value={props.value} disabled={props.disabled} buttonStyle="solid">
        {items}
    </Radio.Group>
}

export {Form}