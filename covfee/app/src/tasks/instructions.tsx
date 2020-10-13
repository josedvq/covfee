import * as React from 'react'
import {
    Row,
    Col,
    Space,
} from 'antd'
import 'antd/dist/antd.css'
import marked from 'marked'

export interface InstructionsTaskProps {
    /**
    * A text or Markdown/HTML string containing the experiment instructions.
    */
    html?: string,
    /**
    * A URL to a Markdown (.md) document containing experiment instructions.
    */
    url?: string
}

export interface InstructionsTaskState {
    html: string,
    error: string
}
class InstructionsTask extends React.Component<InstructionsTaskProps, InstructionsTaskState> {
    
    static defaultProps: InstructionsTaskProps = {
        html: undefined,
        url: undefined
    }

    state: InstructionsTaskState = {
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
            <Row gutter={16}>
                <Col span={24}>
                    <div dangerouslySetInnerHTML={{ __html: this.state.html}}></div>
                </Col>
            </Row>
            <Row>
                <Col span={24}>
                    
                </Col>
            </Row>
        </>
    }
}

export default InstructionsTask