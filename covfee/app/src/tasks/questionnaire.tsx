import React from 'react'
import {
    Row,
    Col,
    Space,
    Divider,
    Button
} from 'antd';
import VideojsPlayer from '../players/videojs'
import Task from './task'
import {Form} from '../form'

class QuestionnaireTask extends React.Component {

    private player = React.createRef()

    componentDidMount() {
    }

    handleSubmit() {
        this.props.on_submit()
    }

    render() {
        const videoJsOptions = {
            autoplay: true,
            controls: true,
            fluid: true,
            aspectRatio: '16:9',
            sources: [{
                src: this.props.media.url,
                type: 'video/mp4'
            }]
        }
        return <Task>
            <Row gutter={16}>
                <Col span={16}>
                    <VideojsPlayer {...videoJsOptions}></VideojsPlayer>
                </Col>
                <Col span={8}>
                    <Form {...this.props.form} on_submit={this.handleSubmit.bind(this)}></Form>
                </Col>
            </Row>
            <Row gutter={16}>
                <pre>
                    {JSON.stringify(this.props.form, null, 2)}
                </pre>
            </Row>
        </Task>
    }
}

export default QuestionnaireTask