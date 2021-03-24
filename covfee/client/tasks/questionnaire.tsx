import * as React from 'react'
import {
    Row,
    Col,
    Button,
    Alert
} from 'antd'
import VideojsPlayer from '../players/videojs'
import WaveSurferBasicPlayer from '../players/wavesurfer_basic'
import {Form} from '../input/form'
import { BaseTaskProps } from './props'
import { QuestionnaireTaskSpec } from '@covfee-types/tasks/questionnaire'
import { TaskObject } from '@covfee-types/task'

interface Props extends TaskObject, BaseTaskProps {
    spec: QuestionnaireTaskSpec
}

type Values = Array<Array<string | number>>
interface State {
    media: {
        paused: boolean
    },
    form: {
        values: Values
        completed: boolean
        disabled: boolean
    }
}

class QuestionnaireTask extends React.Component<Props, State> {

    state: State = {
        media: {
            paused: true
        },
        form: {
            values: [[]],
            completed: false,
            disabled: true
        }
    }

    constructor(props: Props) {
        super(props)
        if (props.spec.disabledUntilEnd != undefined)
            this.state.form.disabled = props.spec.disabledUntilEnd
    }

    handleChange = (values: Values) => {
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

    handleMediaEnded = () => {
        this.setState({
            form: {
                ...this.state.form,
                disabled: false
            }
        })
    }

    handleSubmit = () => {
        this.props.onSubmit(this.state.form.values)
    }

    render() {
        // instructions
        let instructions = <></>
        if(this.props.spec.instructions) {
            instructions = <Row gutter={16} style={{ padding: '1em' }}>
                <Col span={24}>
                    <Alert type="info" message={'Instructions'} description={this.props.spec.instructions}  showIcon/>
                </Col>
            </Row>
        }

        // media
        let media
        switch(this.props.spec.media.type) {
            case 'video':
                media = <VideojsPlayer 
                            {...this.props.spec.media} 
                            onEnded={this.handleMediaEnded} />
                break
            case 'audio':
                media = <WaveSurferBasicPlayer 
                            {...this.props.spec.media} 
                            onEnded={this.handleMediaEnded}/>
                break
            default:
                media = <p>Unrecognized media type.</p>
        }
        return <>
            {instructions}
            <Row gutter={16}>
                <Col span={16}>
                    {media}
                </Col>
                <Col span={8}>
                    <Form {...this.props.spec.form}
                        values={this.state.form.values} 
                        disabled={this.state.form.disabled} 
                        setValues={this.handleChange}></Form>
                    <Button disabled={!this.state.form.completed} onClick={this.handleSubmit}>Next</Button>
                </Col>
            </Row>
        </>
    }
}

export default QuestionnaireTask