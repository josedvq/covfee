import React from 'react';
import { 
    Radio, 
    Divider, 
    Slider,
    Button,
    Space,
    List,
    Alert
} from 'antd';

class Form extends React.Component {
    
    handle_change(idx: number, fieldset_values: Array<any>) {
        let new_state = this.props.values.slice()
        new_state[idx] = fieldset_values
        this.props.onChange(new_state)
    }

    render() {
        return <>
            <Fieldset idx={0} fields={this.props.fields} values={this.props.values[0]} on_change={this.handle_change.bind(this)}></Fieldset>
            </>
    }
}

class Fieldset extends React.Component {
    componentDidMount() {
        const initial_state = new Array(this.props.fields.length).fill(null);
        this.props.on_change(this.props.idx, initial_state)
    }

    handle_change(idx: number, new_val: any) {
        let new_state = this.props.values.slice()
        new_state[idx] = new_val
        this.props.on_change(this.props.idx, new_state)
    }

    render() {
        const elems = []
        for (const [index, spec] of this.props.fields.entries()) {
            elems.push(<Field key={index} idx={index} spec={spec} value={this.props.values[index]} on_change={this.handle_change.bind(this)}></Field>)
        }
        return <>
            <List itemLayout='vertical'>
                {elems}
            </List>
            </>
    }
}

class Field extends React.Component {
    handle_change(e: any) {
        this.props.on_change(this.props.idx, e.target.value)
    }

    render() {
        let prompt = <p>{this.props.spec.prompt}</p>

        let input = null
        switch (this.props.spec.input.type) {
            case 'radio':
                input = <MyRadio options={this.props.spec.input.options} value={this.props.value} on_change={this.handle_change.bind(this)}/>
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
        items.push(<Radio.Button key={index} value={index} onChange={props.on_change}>{text}</Radio.Button>)
    }
    return <Radio.Group value={props.value} buttonStyle="solid">
        {items}
    </Radio.Group>
}

export {Form}