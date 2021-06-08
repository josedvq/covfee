import * as React from 'react'
import {
    Row,
    Col,
    Alert
} from 'antd'
import VideojsPlayer from '../players/videojs'
import WaveSurferPlayer from '../players/wavesurfer'
import {Form, FormState} from '../input/form'
import { BaseTaskProps, CovfeeTask } from './base'
import { QuestionnaireTaskSpec } from '@covfee-types/tasks/questionnaire'
import { TaskType } from '@covfee-types/task'

interface Props extends TaskType, BaseTaskProps {
    spec: QuestionnaireTaskSpec
}

interface State {
    media: {
        paused: boolean
    },
    form: {
        values: FormState
        disabled: boolean
    }
}

export class QuestionnaireTask extends CovfeeTask<Props, State> {

    state: State = {
        media: {
            paused: true
        },
        form: {
            values: this.props.spec.form && this.props.spec.form.fields.map(field=>{return {name: field.name}}),
            disabled: this.props.disabled
        }
    }

    constructor(props: Props) {
        super(props)
        if(props.response && props.response.data)
            this.state.form.values = props.response.data
            
        if (props.spec.disabledUntilEnd != undefined)
            this.state.form.disabled = props.spec.disabledUntilEnd

        
    }

    handleChange = (values: FormState) => {
        this.setState({
            form: {
                ...this.state.form,
                values: values,
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
        this.props.onSubmit(this.state.form.values, null, true)
    }

    render() {

        return <>
            {this.props.spec.instructions &&
            <Row gutter={16} style={{ padding: '1em' }}>
                <Col span={24}>
                    <Alert
                        type="info"
                        message={'Instructions'}
                        description={this.props.spec.instructions} 
                        showIcon/>
                </Col>
            </Row>}
            <Row gutter={16}>
                <Col span={16}>
                    {(()=>{
                        switch(this.props.spec.media.type) {
                            case 'video':
                               return <VideojsPlayer 
                                            {...this.props.spec.media} 
                                            onEnded={this.handleMediaEnded} />
                            case 'audio':
                                return <WaveSurferPlayer 
                                            {...this.props.spec.media} 
                                            onEnded={this.handleMediaEnded}/>
                            default:
                                return <p>Unrecognized media type.</p>
                        }
                    })()}
                </Col>
                <Col span={8}>
                    <Form {...this.props.spec.form}
                        disabled={this.props.disabled} 
                        values={this.state.form.values} 
                        setValues={this.handleChange}
                        withSubmitButton={true}
                        onSubmit={this.handleSubmit}/>
                </Col>
            </Row>
        </>
    }
}

export default QuestionnaireTask