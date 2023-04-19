import * as React from 'react'
import {
    Row,
    Col,
} from 'antd'
import {Form} from '../input/form'
import { BasicTaskProps, CovfeeTask } from './base'
import { ThreeImagesTaskSpec } from '@covfee-shared/spec/tasks/three_images'
import { TaskType } from '@covfee-shared/spec/task'
import {log, urlReplacer} from '../utils'
import './styles/three_images.css'

interface Props extends TaskType, BasicTaskProps {
    spec: ThreeImagesTaskSpec
}

interface State {
    form: {
        values: any
        disabled: boolean
    }
}

export class ThreeImagesTask extends CovfeeTask<Props, State> {

    state: State = {
        form: {
            values: null,
            disabled: this.props.disabled
        }
    }

    constructor(props: Props) {
        super(props)
        if(props.response && props.response.data)
            this.state.form.values = props.response.data
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
        })
    }

    handleSubmit = () => {
        this.props.onSubmit(this.state.form.values, null, true)
    }

    render() {

        return <>
            {this.props.spec.text && 
                <Row gutter={16}>
                    <Col span={24}>
                        <p style={{margin: '1em'}}>{this.props.spec.text}</p>
                    </Col>
                </Row>
            }
            
            <Row gutter={16}>
                <Col span={24}>
                    <div style={{display: 'flex'}}>
                        <div className='bubble-cloud'>
                            <div>Domain</div>
                            <img src={urlReplacer(this.props.spec.images[0])} />
                        </div>
                        <div className='bubble-cloud'>
                            <div>Domain</div>
                            <img src={urlReplacer(this.props.spec.images[1])} />
                        </div>
                    </div>
                    <div style={{display: 'flex'}}>
                        <div className='bubble-cloud'>
                            <div>Domain</div>
                            <img src={urlReplacer(this.props.spec.images[2])}  style={{margin: '0 auto'}}/>
                        </div>
                    </div>
                </Col>
            </Row>

            <Row>
                <Col span={24}>
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

export default ThreeImagesTask