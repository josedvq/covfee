
import * as React from 'react'
import { withRouter } from 'react-router'
import Annotation from './hit'
import Constants from 'Constants'
import { fetcher, getUrlQueryParam, throwBadResponse} from '../utils'

import {
    LoadingOutlined,
} from '@ant-design/icons';
import {
    Row,
    Col,
    Space,
    Typography
} from 'antd';
import {
    HashRouter as Router,
    Switch,
    Route,
} from "react-router-dom"
const { Text, Title, Link } = Typography

interface HITSpec {
    id: string,
    type: string,
    tasks: Array<any>,
    submitted: boolean
}

interface HITState {
    status: string,
    previewMode: boolean,
    error: string,
    hit: HITSpec
}

/**
 * Retrieves the HIT and renders and annotation component. Stores the preview state.
 */
class HIT extends React.Component<any, HITState> {
    id: string
    url: string

    state: HITState = {
        status: 'loading',
        previewMode: false,
        error: null,
        hit: null,
    }

    constructor(props) {
        super(props)

        this.id = props.match.params.hitId
        this.state.previewMode = (getUrlQueryParam('preview') == '1')
        if (this.state.previewMode) this.url = Constants.api_url + '/instance-previews/' + this.id
        else this.url = Constants.api_url + '/instances/' + this.id
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
            }).catch(error => {
                this.setState({
                    status: 'error',
                    error
                });
            })
    }

    handleSubmit = () => {
        // submit HIT to get completion code
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 'success': true })
        }
        let p = fetcher(this.url + '/submit', requestOptions)
            .then(throwBadResponse)
            
        p.then(hit=>{
            // success
            this.setState({
                hit: hit
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
                return <Route path={`${this.props.match.path}/:taskId?`}>
                    <Annotation
                        {...this.state.hit}
                        url={this.url}
                        routingEnabled={true}
                        previewMode={this.state.previewMode}
                        onSubmit={this.handleSubmit} />
                </Route>
            default:
                return <></>
        }
    }
}

const HITWithRouter = withRouter(HIT)

export { HITSpec, HITWithRouter}