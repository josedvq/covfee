
import * as React from 'react'
import styled from 'styled-components'
import { Modal } from 'antd'
import Title from 'antd/lib/typography/Title'
import { withRouter } from 'react-router'
import {
    LoadingOutlined, WindowsFilled,
} from '@ant-design/icons'
import {
    Route, RouteComponentProps,
} from "react-router-dom"

import Constants from 'Constants'
import Hit from './hit'
import { fetcher, getUrlQueryParam, myerror, throwBadResponse, ErrorPage} from '../utils'
import {HitInstanceType} from '@covfee-types/hit'
import { EditableTaskFields, TaskResponse, TaskType } from '@covfee-types/task'

interface MatchParams {
    hitId: string
}

interface Props extends RouteComponentProps<MatchParams> {}

interface State {
    /**
     * True when the hit is being (re)loaded.
     */
    loading: boolean
    /**
     * Holds the status of the component
     * - init is the initial state
     * - ready when the HIT has been loaded successfully
     * - error when the HIT is not found (404) or other error
     */
    status: 'init' | 'ready' | 'error'
    /**
     * If the HIT should be loaded in preview mode (no data recording)
     */
    previewMode: boolean
    /**
     * Error message received from the server
     * Only set if status == 'error'
     */
    error: string
    /**
     * Tracks the state of the window
     * Fed to the sidebar to adjust its height
     */
    containerHeight: number
    tasks: TaskType[]
}

/**
 * Retrieves the HIT and reders it in a HIT component.
 * Implements most of the async operations and callbacks of the HIT component.
 */
class HitLoader extends React.Component<Props, State> {
    id: string
    url: string
    onresize: () => void

    state: State = {
        loading: true,
        status: 'init',
        previewMode: false,
        error: null,
        containerHeight: 0,
        tasks: []
    }

    hit: HitInstanceType
    
    idTaskMap: {[key:string]: {parentIndex: number, childIndex: number}}

    constructor(props: Props) {
        super(props)

        this.id = props.match.params.hitId
        this.state.previewMode = (getUrlQueryParam('preview') == '1')
        if (this.state.previewMode) this.url = Constants.api_url + '/instance-previews/' + this.id
        else this.url = Constants.api_url + '/instances/' + this.id
    }

    componentDidMount() {
        this.loadHit()
        this.onresize = () => {
            //note i need to pass the event as an argument to the function
            this.setState({containerHeight: window.innerHeight})
        }
        this.onresize()
        addEventListener("resize", this.onresize);
    }

    componentWillUnmount() {
        removeEventListener('resize', this.onresize)
    }

    loadHit = (cb?: any) => {
        const url = this.url + '?' + new URLSearchParams({
        })
        this.setState({loading: true})

        return Promise.all([
            fetch(url)
            .then(throwBadResponse)
            .then((hit: HitInstanceType) => {
                const status = 'ready'
                this.hit = hit

                const tasks = hit.tasks
                delete hit['tasks']

                this.idTaskMap = {}
                tasks.forEach((task, i) => {
                    this.idTaskMap[task.id] = {parentIndex: i, childIndex: null}
                    task.children.forEach((child, j) => {
                        this.idTaskMap[child.id] = {parentIndex: i, childIndex: j}
                    })
                })
                

                this.setState({
                    tasks: tasks,
                    status: status,
                })
            }).catch(error => {
                this.setState({
                    status: 'error',
                    error
                })
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
            this.setState({loading: false}, ()=>{if(cb) cb()})
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
            .then(hit => {
                this.hit = {
                    ...this.hit,
                    submitted: true,
                    completionInfo: hit.completionInfo
                }
                this.setState(this.state)
            })

        return p
    }

    handleTaskDelete = (taskId: number) => {
        // deleting existing task
        const url = Constants.api_url + '/tasks/' + taskId + '/delete'

        return fetch(url)
            .then(throwBadResponse)
            .then(_ => {
                const {parentIndex, childIndex} = this.idTaskMap[taskId]
                if(childIndex === null) {
                    const tasks = [...this.state.tasks]
                    tasks.splice(parentIndex, 1)
                    this.setState({tasks: tasks})
                } else {
                    const tasks = [...this.state.tasks]
                    const children = [...tasks[parentIndex].children]
                    children.splice(childIndex)
                    tasks[parentIndex] = {
                        ...tasks[parentIndex],
                        children: children
                    }
                    this.setState({tasks: tasks})
                }
                delete this.idTaskMap[taskId]
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
                const {parentIndex, childIndex} = this.idTaskMap[taskId]
                if(childIndex === null) {
                    const tasks = [...this.state.tasks]
                    tasks[parentIndex] = data
                    this.setState({tasks: tasks})
                } else {
                    const tasks = [...this.state.tasks]
                    const children = [...tasks[parentIndex].children]
                    children[childIndex] = data
                    tasks[parentIndex] = {
                        ...tasks[parentIndex],
                        children: children
                    }
                    this.setState({tasks: tasks})
                }
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
                const tasks = [...this.state.tasks, data]
                this.setState({
                    tasks: tasks
                })
            })
    }

    handleResponseSubmit = (response: TaskResponse, data: any) => {
        const url = response.url + '/submit?' + new URLSearchParams({
        })

        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }

        // now send the task results
        const p = fetcher(url, requestOptions)
        .then(throwBadResponse)   
        .then(res => {
            const {parentIndex, childIndex} = this.idTaskMap[response.task_id]
            const tasks = [...this.state.tasks]
            if(childIndex === null) {
                tasks[parentIndex] = {
                    ...tasks[parentIndex],
                    valid: res.valid,
                    num_submissions: tasks[parentIndex].num_submissions + 1
                }
            } else {
                const children = [...this.state.tasks[parentIndex].children]
                children[childIndex] = {
                    ...children[childIndex],
                    valid: res.valid,
                    num_submissions: tasks[parentIndex].num_submissions + 1
                }
                tasks[parentIndex] = {
                    ...tasks[parentIndex],
                    children: children
                }
            }
            
            return new Promise(resolve => this.setState({ tasks: tasks}, () => {resolve(res)}))
            
        })
        

        return p
    }

    fetchTaskResponse = (task: TaskType) => {
        const url = task.url +'/response?' + new URLSearchParams({
        })
        const p = fetcher(url)
            .then(throwBadResponse)

        p.catch(error => {
            myerror('Error fetching task response.', error)
        })

        return p
    }

    render404() {
        return <ErrorPage/>
    }

    render() {
        if(this.state.status == 'error') return this.render404()

        return <>
            {this.state.loading === true && 
                <Modal title={<Title level={4}><LoadingOutlined /> Loading tasks</Title>} visible={true} footer={null} closable={false}>
                    Please give a second..
                </Modal>
            }
            <HitContainer>
            {(() => {
                switch (this.state.status) {
                    case 'ready':
                        return <Route path={`${this.props.match.path}/:taskId?`}>
                            <Hit
                                {...this.hit}
                                tasks={this.state.tasks}
                                height={this.state.containerHeight}
                                routingEnabled={true}
                                previewMode={this.state.previewMode}
                                reloadHit={this.loadHit}

                                // async operations
                                deleteTask={this.handleTaskDelete}
                                editTask={this.handleTaskEdit}
                                createTask={this.handleTaskCreate}

                                submitTaskResponse={this.handleResponseSubmit}
                                fetchTaskResponse={this.fetchTaskResponse}

                                onSubmit={this.handleSubmit} />
                            
                        </Route>
                    default:
                        return <></>
            }})()}
            </HitContainer>
        </>
        
    }
}

const HitContainer = styled.div`
    position: relative;
    height: 100%;
    width: 100%;
`

const HitLoaderWithRouter = withRouter(HitLoader)

export { HitLoaderWithRouter}