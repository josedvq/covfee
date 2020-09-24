import React from 'react'
import {
    Row,
    Col,
    Space,
    Divider,
    Button
} from 'antd'
import Task from 'Tasks/task'

class InstructionsTask extends React.Component {

    render() {
        return <Task validate={()=>{return true}}>
            <Row gutter={16}>
                <Col span={16}>
                    {this.props.text}
                </Col>
                <Col span={8}>
                    <Task.Submit>Next</Task.Submit>
                </Col>
            </Row>
        </Task>
    }
}

export default InstructionsTask