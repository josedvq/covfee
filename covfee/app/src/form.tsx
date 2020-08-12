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
    public state = {
        'values': [[]],
        'sending': false,
        'missing_values': true,
        'error': false
    }

    handle_next_click() {
        this.setState({ sending: true })

        // POST request using fetch with error handling
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.state.values)
        }

        fetch(this.props.submit_url, requestOptions)
            .then(async response => {
                const data = await response.json()

                // check for error response
                if (!response.ok) {
                    // get error message from body or default to response status
                    const error = (data && data.message) || response.status
                    return Promise.reject(error)
                }

                this.props.on_submit()
            })
            .catch(error => {
                this.setState({ error: error.toString(), sending: false })
                console.error('There was an error!', error)
            })
    }

    handle_change(fieldset_values: Array<any>) {
        const has_null = fieldset_values.some((val) => {
            return val === null
        })

        this.setState({
            'values': [fieldset_values],
            'missing_values': has_null
        })
    }

    render() {
        let error = ''
        if(this.state.error) {
            error = <Alert
                description={"Error sending to server." + this.state.error}
                type="error"
                showIcon
            />
        }
        
        return <>
            <Fieldset fields={this.props.fields} values={this.state.values[0]} on_change={this.handle_change.bind(this)}></Fieldset>
            <Button type="primary" onClick={this.handle_next_click.bind(this)} loading={this.state.sending} disabled={this.state.missing_values}>Next</Button>
            {error}
            </>
    }
}

class Fieldset extends React.Component {
    componentDidMount() {
        const initial_state = new Array(this.props.fields.length).fill(null);
        this.props.on_change(initial_state)
    }

    handle_change(idx: number, new_val: any) {
        let new_state = this.props.values.slice()
        new_state[idx] = new_val
        this.props.on_change(new_state)
    }

    render() {
        const elems = []
        for (const [index, spec] of this.props.fields.entries()) {
            elems.push(<Field idx={index} spec={spec} value={this.props.values[index]} on_change={this.handle_change.bind(this)}></Field>)
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
        items.push(<Radio.Button value={index} onChange={props.on_change}>{text}</Radio.Button>)
    }
    return <Radio.Group value={props.value} buttonStyle="solid">
        {items}
    </Radio.Group>
}

export {Form}