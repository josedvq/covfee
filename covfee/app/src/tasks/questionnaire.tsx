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
    public state = {
        form: {
            values: [[]],
            completed: false
        }
    }

    handleChange(values: object) {
        const has_null = values[0].some((val) => {
            return val === null
        })

        this.setState({
            form: {
                values: values,
                completed: !has_null
            }
        })
    }

    validate() {
        return this.state.form.values
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
        //
        return <Task {...this.props } validate = { this.validate.bind(this) } >
            <Row gutter={16}>
                <Col span={16}>
                    <VideojsPlayer {...videoJsOptions}></VideojsPlayer>
                </Col>
                <Col span={8}>
                    <Form {...this.props.form} values={this.state.form.values} onChange={this.handleChange.bind(this)}></Form>
                    <Task.Submit disabled={!this.state.form.completed}></Task.Submit>
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