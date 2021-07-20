import * as React from 'react'
import {
    Row,
    Col,
    Alert
} from 'antd'
import VideojsPlayer from '../players/videojs'
import WaveSurferPlayer from '../players/wavesurfer'
import {Form} from '../input/form'
import { BasicTaskProps, CovfeeTask } from './base'
import { QuestionnaireTaskSpec } from '@covfee-types/tasks/questionnaire'
import { TaskType } from '@covfee-types/task'

interface Props extends TaskType, BasicTaskProps {
    spec: QuestionnaireTaskSpec
}

interface State {
    media: {
        paused: boolean
    },
    form: {
        values: any
        disabled: boolean
    }
}

export class QuestionnaireTask extends CovfeeTask<Props, State> {

    state: State = {
        media: {
            paused: true
        },
        form: {
            // values: this.props.spec.form && this.props.spec.form.fields.map(field=>{return {name: field.name}}),
            values: {},
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

    handleChange = (values: any) => {
        this.setState({
            form: {
                ...this.state.form,
                values: {
                    ...this.state.form.values,
                    ...values
                }
            }
        }, ()=>{console.log(this.state.form.values)})
        
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
            <Row gutter={16}>
                {this.props.spec.media &&
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
                </Col>}
                <Col span={this.props.spec.media ? 8 : 24}>
                    <Form {...this.props.spec.form}
                        disabled={this.props.disabled} 
                        values={this.state.form.values} 
                        setValues={this.handleChange}
                        withSubmitButton={true}
                        renderSubmitButton={this.props.renderSubmitButton}
                        onSubmit={this.handleSubmit}/>
                </Col>
            </Row>
        </>
    }
}

export default QuestionnaireTask