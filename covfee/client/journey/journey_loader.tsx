
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
import Hit from './journey'
import { fetcher, getUrlQueryParam, myerror, throwBadResponse} from '../utils'
import { ErrorPage } from "../jsx_utils"
import {HitInstanceType} from '@covfee-spec/hit'
import { EditableTaskFields, TaskResponse, TaskType } from '@covfee-shared/spec/task'

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
class JourneyLoader extends React.Component<Props, State> {
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

const HitLoaderWithRouter = withRouter(JourneyLoader)

export { HitLoaderWithRouter }