import * as React from 'react'
import {
    Row,
    Col,
} from 'antd'
import {Form} from '../input/form'
import { BasicTaskProps, CovfeeTask } from './base'
import { ThreeImagesTaskSpec } from '@covfee-types/tasks/three_images'
import { TaskType } from '@covfee-types/task'
import {log, urlReplacer} from '../utils'

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
                <Row gutter={16}>{this.props.spec.text}</Row>
            }
            
            <Row gutter={16}>
                <Col span={16}>
                    <img src={{urlReplacer(this.props.spec.images[0])}}/>
                    <img src={{urlReplacer(this.props.spec.images[1])}}/>
                    <img src={{urlReplacer(this.props.spec.images[2])}}/>
                </Col>
            </Row>

            <Row>
                <Form {...this.props.spec.form}
                    disabled={this.props.disabled} 
                    values={this.state.form.values} 
                    setValues={this.handleChange}
                    withSubmitButton={true}
                    renderSubmitButton={this.props.renderSubmitButton}
                    onSubmit={this.handleSubmit}/>
            </Row>
        </>
    }
}

export default ThreeImagesTask