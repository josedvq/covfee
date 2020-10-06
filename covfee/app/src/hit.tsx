
import * as React from 'react'
import { withRouter } from 'react-router'
import Timeline from './timeline'
import Annotation from './annotation'
const Constants = require('./constants.json')
import { throwBadResponse} from './utils'

import {
    LoadingOutlined,
} from '@ant-design/icons';
import {
    Row,
    Col,
    Space,
    Typography
} from 'antd';
const { Text, Title, Link } = Typography
import {TaskSpec} from './tasks/task'

interface HITSpec {
    id: string,
    type: string,
    media?: any,
    tasks: Array<TaskSpec>,
    submitted: boolean
}

interface HITState {
    status: string,
    error: string,
    hit: HITSpec
}

class HIT extends React.Component<any, HITState> {
    id: string
    url: string

    state: HITState = {
        status: 'loading',
        error: null,
        hit: null,
    }

    constructor(props) {
        super(props)

        this.id = props.match.params.hitId
        this.url = Constants.api_url + '/instances/' + this.id
    }

    componentDidMount() {
        fetch(this.url)
            .then(throwBadResponse)
            .then((hit: HITSpec) => {
                if (hit.submitted) {
                    this.setState({
                        status: 'finished',
                        hit: hit
                    })
                } else {
                    this.setState({
                        status: 'ready',
                        hit: hit
                    })
                }
            })
            // Note: it's important to handle errors here
            // instead of a catch() block so that we don't swallow
            // exceptions from actual bugs in components.
            .catch(error => {
                this.setState({
                    status: 'error',
                    error
                });
            })
    }

    handleSubmit = () => {
        this.setState({
            status: 'sending'
        })

        // submit timeline to get completion code
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 'success': true })
        }
        let p = fetch(this.url + '/submit', requestOptions)
            .then(throwBadResponse)
            
        p.then(data=>{
            // success
            this.setState({
                status: 'finished',
                completion_code: data.completion_code,
                error: false
            })
        })
        .catch(error => {
            this.setState({
                status: 'finished',
                error: error.toString()
            })
        })

        return p
    }

    render() {
        switch (this.state.status) {
            case 'loading':
                return <div className={'site-layout-content'}>
                    <LoadingOutlined />
                </div>
            case 'ready':
                switch (this.state.hit.type) {
                    case 'annotation':
                        return <Annotation {...this.state.hit} onSubmit={this.handleSubmit}/>
                    case 'timeline':
                        return <Timeline {...this.state.hit} onSubmit={this.handleSubmit}/>
                    default:
                        return <div>Unknown HIT type</div>
                }
            case 'sending':
                return <div className={'site-layout-content'}>
                    <LoadingOutlined />
                </div>

            case 'finished':
                if (this.state.error) {
                    return <>
                        <div className={'site-layout-content'}>
                            <Row gutter={16}>
                                <Col span={24}>
                                    <Space direction="vertical">
                                        <Title level={2}>Oops!</Title>
                                        <Text>Something went wrong when sending the task to the server.
                                        Please try again in a few minutes.
                                        If the issue persists please email
                                            <a href={'mailto:' + this.timeline.project.email}> {this.timeline.project.email}</a>
                                        </Text>
                                    </Space>
                                </Col>
                            </Row>
                        </div>
                    </>
                } else {
                    let code = ''
                    if (this.state.completion_code) {
                        code = <>
                            <Text>Your completion code: </Text>
                            <Text code>{this.state.completion_code}</Text>
                        </>
                    }
                    return <>
                        <div className={'site-layout-content'}>
                            <Row gutter={16}>
                                <Col span={24}>
                                    <Title level={2}>Thank you!</Title>
                                    {code}
                                </Col>
                            </Row>
                        </div>
                    </>
                }
            default:
                return <></>
        }
    }
}

const HITWithRouter = withRouter(HIT)

export { HITSpec, HITWithRouter}