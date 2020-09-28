import * as React from 'react'
import {
    Row,
    Col,
    Space,
    Divider,
    Button
} from 'antd';
import VideojsPlayer from '../players/videojs'
import {Task} from 'Tasks'
import {Form} from '../form'

class QuestionnaireTask extends React.Component {

    private player = React.createRef()
    public state = {
        form: {
            values: [[]],
            completed: false,
            disabled: true
        }
    }

    handleChange = (values: object) => {
        const has_null = values[0].some((val) => {
            return val === null
        })

        this.setState({
            form: {
                ...this.state.form,
                values: values,
                completed: !has_null
            }
        })
    }

    handleVideoEnded = () => {
        this.setState({
            form: {
                ...this.state.form,
                disabled: false
            }
        })
    }

    validate = () => {
        return this.state.form.values
    }

    render() {
        const mediaOptions = {
            autoplay: false,
            controls: true,
            fluid: true,
            aspectRatio: '16:9',
            sources: [{
                src: this.props.media.url,
                type: 'video/mp4'
            }]
        }
        //
        return <Task {...this.props } validate = { this.validate } >
            <Row gutter={16}>
                <Col span={16}>
                    <VideojsPlayer {...mediaOptions} onEnded={this.handleVideoEnded}></VideojsPlayer>
                </Col>
                <Col span={8}>
                    <Form {...this.props.form} 
                        values={this.state.form.values} 
                        disabled={this.state.form.disabled} 
                        onChange={this.handleChange}></Form>
                    <Task.Submit disabled={!this.state.form.completed} text="Next"/>
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