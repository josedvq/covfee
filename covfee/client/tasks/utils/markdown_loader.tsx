import * as React from 'react'
import {
    Row,
    Col,
} from 'antd'
import ReactMarkdown from 'react-markdown/with-html'
import { MarkdownContentSpec } from "@covfee-types/tasks/utils";

interface Props {
    content: MarkdownContentSpec
}

interface State {
    markdown: string,
    error: string
}

export class MarkdownLoader extends React.Component<Props, State> {
    
    state: State = {
        markdown: '',
        error: ''
    }

    componentDidMount() {
        if(this.props.content.type == 'raw') {
            this.setState({
                markdown: this.props.content.content
            })
        } else {
            fetch(this.props.content.url)
                .then(res => res.text())
                .then(doc => {
                    this.setState({
                        markdown: doc
                    })
                }).catch(error => {
                    this.setState({
                        error: `Error reading file ${this.props.content.url}`
                    });
                })
        }
    }

    render() {
        return <>
            <Row gutter={0}>
                <Col span={24}>
                    <ReactMarkdown children={this.state.markdown} allowDangerousHtml></ReactMarkdown>
                </Col>
            </Row>
        </>
    }
}