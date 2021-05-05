import * as React from 'react'
import {
    Row,
    Col,
} from 'antd'
import { InstructionsTaskSpec } from '@covfee-types/tasks/instructions'
import { MarkdownLoader } from './utils/markdown_loader'
import { BaseTaskProps, CovfeeTask } from './base'
import { TaskType } from '@covfee-types/task'
import { Form, FormState } from '../input/form'

interface Props extends TaskType, BaseTaskProps {
    spec: InstructionsTaskSpec
}

interface State {
    form: {
        values: FormState
    }
}
export class InstructionsTask extends CovfeeTask<Props, State> {

    state: State = {
        form: {
            values: this.props.spec.form && this.props.spec.form.fields.map(field=>{return {name: field.name}}) 
        }
    }

    constructor(props: Props) {
        super(props)
        if(props.response && props.response.data)
            this.state.form.values = props.response.data
    }

    handleSubmit = (values: any) => {
        const vals = this.state.form.values
        if(!vals || !vals.length)
            this.props.onSubmit(null)

        this.props.onSubmit(vals)
    }

    handleFormChange = (values: any) => {
        this.setState({
            form: {
                ...this.state.form,
                values: values,
            }
        })
        
    }

    render() {
        return <Row style={{margin: '2em 0'}}>
            <Col sm={{span:22, offset:1}} md={{span: 20, offset: 2}} lg={{span:16, offset: 4}} xl={{span: 14, offset: 5}}>
                <MarkdownLoader content={this.props.spec.content}/>
                <Form {...this.props.spec.form}
                        disabled={this.props.disabled}
                        values={this.state.form.values} 
                        setValues={this.handleFormChange}
                        withSubmitButton={true}
                        onSubmit={this.handleSubmit}/>
            </Col>
        </Row>
    }
}

export { MarkdownLoader}
export default InstructionsTask