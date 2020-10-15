import * as React from 'react'
import {
    Row,
    Col,
    Button
} from 'antd';
import VideojsPlayer from '../players/videojs'
import {Form} from '../input/form'
import { BaseTaskProps } from './task';

interface Props extends BaseTaskProps {
    /**
     * Specification of the form to be created.
     */
   form: object
}

class QuestionnaireTask extends React.Component<Props> {

    private player = React.createRef()
    public state = {
        form: {
            values: [[]],
            completed: false,
            disabled: true
        }
    }

    componentDidMount() {
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

    render() {
        return <>
            <Row gutter={16}>
                <Col span={16}>
                    <VideojsPlayer {...this.props.media} onEnded={this.handleVideoEnded}/>
                </Col>
                <Col span={8}>
                    <Form {...this.props.form}
                        key={this.props.form}
                        values={this.state.form.values} 
                        disabled={this.state.form.disabled} 
                        onChange={this.handleChange}></Form>
                    <Button disabled={!this.state.form.completed}>Next</Button>
                </Col>
            </Row>
        </>
    }
}

export default QuestionnaireTask