
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
import { Modal } from 'antd'
import Title from 'antd/lib/typography/Title'
import { EditableTaskFields } from '@covfee-types/task'

interface MatchParams {
    hitId: string
}

interface Props extends RouteComponentProps<MatchParams> {}

interface State {
    loading: boolean
    status: string
    previewMode: boolean
    error: string
    hit: HitType
}

/**
 * Retrieves the HIT and renders and Hit component. Stores the preview state.
 */
class HitLoader extends React.Component<Props, State> {
    id: string
    url: string

    state: State = {
        loading: true,
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

    loadHit = (cb: any) => {
        const url = this.url + '?' + new URLSearchParams({
        })
        this.setState({loading: true})

        return Promise.all([
            fetch(url)
            .then(throwBadResponse)
            .then((hit: HitType) => {
                const status = hit.submitted ? 'finished' : 'ready'
                const tasksDict = {}
                hit.tasks.forEach(task => {
                    tasksDict[task.id] = task
                    task.children.forEach(child => {
                        tasksDict[child.id] = child
                    })
                    delete task['children']
                })
                hit.tasks = tasksDict
                this.setState({
                    status: status,
                    hit: hit
                })
            }).catch(error => {
                this.setState({
                    status: 'error',
                    error
                });
            }),
            // minimum duration of the "loading" state will be 1s
            // avoid a flickering modal
            new Promise((resolve, _) => {
                let id = setTimeout(() => {
                  clearTimeout(id)
                  resolve(null)
                }, 1000)
              })
        ]).then(()=>{
            // return new Promise((resolve, _) => {
            this.setState({loading: false}, ()=>{if(cb) cb()})
            // })
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

    handleTaskDelete = (taskId: number) => {
        // deleting existing task
        const url = Constants.api_url + '/tasks/' + taskId + '/delete'

        return fetch(url)
            .then(throwBadResponse)
            .then(_ => {
                const tasks = {...this.state.hit.tasks}
                tasks[taskId] = undefined 
                this.setState({
                    hit: {
                        ...this.state.hit,
                        tasks: tasks
                    }
                })
            })
    }

    handleTaskEdit = (taskId: number, task: EditableTaskFields) => {
        // editing existing task
        const url = Constants.api_url + '/tasks/' + taskId + '/edit'
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task)
        }

        return fetch(url, requestOptions)
            .then(throwBadResponse)
            .then(data => {
                const tasks = {...this.state.hit.tasks}
                tasks[taskId] = data 
                this.setState({
                    hit: {
                        ...this.state.hit,
                        tasks: tasks
                    }
                })
            })
    }

    handleTaskCreate = (parentId: number, task: EditableTaskFields) => {
        // adding new task
        const url = this.url + '/tasks/add'
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task)
        }

        return fetch(url, requestOptions)
            .then(throwBadResponse)
            .then(data => {
                const tasks = {...this.state.hit.tasks}
                tasks[data.id] = data 
                this.setState({
                    hit: {
                        ...this.state.hit,
                        tasks: tasks
                    }
                })
            })
    }

    render() {
        return <>
            {this.state.loading === true && 
                <Modal title={<Title level={4}><LoadingOutlined /> Loading tasks</Title>} visible={true} footer={null} closable={false}>
                    Please give a second..
                </Modal>
            }
            {(() => {
                switch (this.state.status) {
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
            }})()}
        </>
        
    }
}

const HitLoaderWithRouter = withRouter(HitLoader)

export { HitLoaderWithRouter}