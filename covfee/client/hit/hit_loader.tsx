
import * as React from 'react'
import { withRouter } from 'react-router'
import Hit from './hit'
import Constants from 'Constants'
import { fetcher, getUrlQueryParam, throwBadResponse} from '../utils'

import {
    LoadingOutlined,
} from '@ant-design/icons';
import {
    Route, RouteComponentProps,
} from "react-router-dom"
import {HitType} from '@covfee-types/hit'

interface MatchParams {
    hitId: string
}

interface Props extends RouteComponentProps<MatchParams> {}

interface State {
    status: string,
    previewMode: boolean,
    error: string,
    hit: HitType
}

/**
 * Retrieves the HIT and renders and Hit component. Stores the preview state.
 */
class HitLoader extends React.Component<Props, State> {
    id: string
    url: string

    state: State = {
        status: 'loading',
        previewMode: false,
        error: null,
        hit: null,
    }

    constructor(props: Props) {
        super(props)

        this.id = props.match.params.hitId
        this.state.previewMode = (getUrlQueryParam('preview') == '1')
        if (this.state.previewMode) this.url = Constants.api_url + '/instance-previews/' + this.id
        else this.url = Constants.api_url + '/instances/' + this.id
    }

    componentDidMount() {
        this.loadHit()
    }

    loadHit = (only_prerequisites = true) => {
        const url = this.url + '?' + new URLSearchParams({
            only_prerequisites: only_prerequisites ? '1' : '0'
        })
        fetch(url)
            .then(throwBadResponse)
            .then((hit: HitType) => {
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
                    <Hit
                        {...this.state.hit}
                        routingEnabled={true}
                        previewMode={this.state.previewMode}
                        reloadHit={this.loadHit}
                        onSubmit={this.handleSubmit} />
                </Route>
            default:
                return <></>
        }
    }
}

const HitLoaderWithRouter = withRouter(HitLoader)

export { HitLoaderWithRouter}