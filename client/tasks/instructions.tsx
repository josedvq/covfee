import * as React from 'react'
import {
    Row,
    Col,
    Space,
    Button
} from 'antd'
import 'antd/dist/antd.css'
import { InstructionsTaskSpec } from '@covfee-types/tasks/instructions'
import {MarkdownLoader} from './utils/markdown_loader'
import { BaseTaskProps } from './props'
import { TaskObject } from '@covfee-types/task'

interface Props extends TaskObject, BaseTaskProps {
    spec: InstructionsTaskSpec
}


class InstructionsTask extends React.Component<Props> {
    handleSubmit = () => {
        this.props.onSubmit({})
    }

    render() {
        return <Row style={{margin: '2em 0'}}>
            <Col sm={{span:22, offset:1}} md={{span: 20, offset: 2}} lg={{span:16, offset: 4}} xl={{span: 14, offset: 5}}>
                    <MarkdownLoader content={this.props.spec.content}/>
                    <Button type="primary" onClick={this.handleSubmit}>Start!</Button>
            </Col>
        </Row>
    }
}

export { MarkdownLoader}
export default InstructionsTask