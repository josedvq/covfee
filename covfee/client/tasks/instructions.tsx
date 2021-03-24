import * as React from 'react'
import {
    Row,
    Col,
    Space,
    Button
} from 'antd'
import 'antd/dist/antd.css'
import marked from 'marked'
import { BaseTaskProps } from './props'
import { Spec } from '@covfee-types/tasks/instructions'

interface Props extends BaseTaskProps, Spec {

}

interface State {
    html: string,
    error: string
}

class MarkdownLoader extends React.Component<Props, State> {
    
    state: MarkdownLoaderState = {
        html: '',
        error: ''
    }

    componentDidMount() {
        if(this.props.url !== undefined) {
            fetch(this.props.url)
            .then(res => res.text())
            .then(
                (doc) => {
                    this.setState({
                        html: marked(doc)
                    })
                },
                (error) => {
                    this.setState({
                        error: `Error reading file ${this.props.url}`
                    });
                }
            )
        } else {
            this.setState({
                html: marked(this.props.html)
            })
        }
    }

    render() {
        return <>
            <Row gutter={0}>
                <Col span={24}>
                    <div dangerouslySetInnerHTML={{ __html: this.state.html}}></div>
                </Col>
            </Row>
        </>
    }
}

class InstructionsTask extends React.Component<Props, State> {
    handleSubmit = () => {
        this.props.onSubmit({})
    }

    render() {
        return <>
            <MarkdownLoader {...this.props}/>
            <Button type="primary" onClick={this.handleSubmit}>Start!</Button>
        </>
    }
}

export { MarkdownLoader}
export default InstructionsTask