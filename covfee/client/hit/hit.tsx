import * as React from 'react'
import io from 'socket.io-client'
import styled from 'styled-components'
import { withRouter, generatePath, RouteComponentProps } from 'react-router'
import {
    ArrowRightOutlined,
    PlusOutlined
} from '@ant-design/icons'
import {
    Row,
    Col,
    Typography,
    Menu,
    Button, 
    Modal,
    Collapse,
    Progress
} from 'antd'
import 'antd/dist/antd.css'
const { Panel } = Collapse
import Collapsible from 'react-collapsible'
const { Text } = Typography

import Constants from 'Constants'
import { myerror, fetcher, throwBadResponse} from '../utils'
import { MarkdownLoader} from '../tasks/instructions'
import {CovfeeMenuItem} from '../gui'
import {Sidebar} from './sidebar'

import { HitType } from '@covfee-types/hit'
import { TaskType } from '@covfee-types/task'
import { TaskLoader } from './task_loader';
import './hit.scss'

interface MatchParams {
    hitId: string,
    taskId: string
}

type Props = HitType & RouteComponentProps<MatchParams> & {
    /**
     * height of the container (used for adjusting sidebar height)
     */
    height: number
    /**
     * Enables preview mode where data submission is disabled.
     */
    previewMode: boolean,
    /**
     * Tells the annotation component to keep urls up to date
     */
    routingEnabled: boolean

    // ASYNC OPERATIONS
    deleteTask: Function
    editTask: Function
    createTask: Function
    fetchTaskResponse: Function
    reloadHit: Function
    /**
     * Called when the Hit submit button is clicked
     */
    onSubmit: () => Promise<any>
}

interface TaskState {
    id: number
    accessible: boolean
}

interface HitState {
    taskMenuState: {id: number, accessible: boolean, children: {id: number, accessible: boolean}}[]
    /**
     * taskIds that are being displayed in the menu
     * The first number is the parent number and points to this.props.tasks
     * The second number is the child number and points to this.props.tasks
     */
    taskIds: [number, number[]][]
    /**
     * Index of the currently selected task in this.props.tasks
     * The first number points to a parent task
     * The second number, if not null, points to a child task within the parent
     */
    currTask: [number, number]
    /**
     * True if currTask is currently being loaded
     */
    loadingTask: boolean
    /**
     * Used to trigger remounting of tasks
     */
    currKey: number
    /**
     * State of "extra" collapsible with hit-level information
     */
    extraOpen: boolean
    /**
     * If true, prerequisites are completed
     */
    prerequisitesCompleted: boolean
}


export class Hit extends React.Component<Props, HitState> {
    state: any = {
        currKey: 0,
        loadingTask: true,
        extraOpen: false,
        prerequisitesCompleted: false
    }

    url: string
    tasks: Array<TaskType>
    taskKeys: Array<string>
    instructionsFn: Function = null
    socket: any

    replayIndex = 0

    static defaultProps = {
        interface: {
            type: 'annotation',
            userTasks: {},
            showProgress: false,
        }
    }

    constructor(props: Props) {
        super(props)
        // copy props into tasks
        this.url = Constants.api_url + '/instances/' + this.props.id

        // calculate the current task using the route and the HIT
        const taskIds = this.makeTaskIds()
        let parentTask = 0
        if (props.match && props.match.params.taskId !== undefined) {
            parentTask = Math.min(taskIds.length-1, parseInt(props.match.params.taskId))
        }

        // Initialize the hit state
        this.state = {
            ...this.state,
            currTask: [parentTask, null],
            taskIds: taskIds,
            prerequisitesCompleted: this.prerequisitesCompleted()
        }
        
        this.updateUrl(parentTask)

        // Connect to socket io
        if(Constants.socketio_enabled) {
            this.socket = io(Constants.base_url, {
                auth: {
                    hitId: this.props.id,
                    token: this.props.token
                },
                transports: ['websocket'],
                upgrade: true
            })
        }
    }

    // makeTaskMenuState = () => {
    //     const hierarchy: {[key: string]: {children: number[]}} = {}
    //     for (const task of Object.values(this.props.tasks)) {
    //         if(task.parent_id == null) hierarchy[task.id] = {children: []}
    //         else {
    //             if(!(task.parent_id in hierarchy)) hierarchy[task.parent_id] = {children: []}
    //             hierarchy[task.parent_id].children.push(task.id)
    //         }
    //     }

    //     const taskIds = Object.keys(hierarchy).map((key, _) => {
    //         return [parseInt(key), hierarchy[key]['children']]
    //     })
    // }

    makeTaskIds = () => {
        const hierarchy: {[key: string]: {children: number[]}} = {}
        for (const task of Object.values(this.props.tasks)) {
            if(task.parent_id == null) hierarchy[task.id] = {children: []}
            else {
                if(!(task.parent_id in hierarchy)) hierarchy[task.parent_id] = {children: []}
                hierarchy[task.parent_id].children.push(task.id)
            }
        }

        const taskIds = Object.keys(hierarchy).map((key, _) => {
            return [parseInt(key), hierarchy[key]['children']]
        })

        return taskIds as [number, number[]][]
    }

    componentDidMount() {
        // run fetches that update state
        // this.handleChangeActiveTask(this.state.currTask)
    }

    componentDidUpdate(prevProps: Props) {
        if(this.props.tasks != prevProps.tasks) {
            this.setState({taskIds: this.makeTaskIds() })
        }
    }

    getTask = (taskId: [number, number]) => {
        if(taskId[1] == null) {
            return this.props.tasks[this.state.taskIds[taskId[0]][0]]
        } else {
            return this.props.tasks[this.state.taskIds[taskId[0]][1][taskId[1]]]
        }
    }

    /**
     * sequence for prevChild: null, 0, 1, 2, 3, null, null, 0, 1, 2, 3
     *                         0     0, 0, 0, 0, 1,    2,    2, 2, 2, 2
     * @param taskId 
     * @returns 
     */
    getPrevTask = (taskId: [number, number]) => {
        const parent = taskId[0]
        const child = taskId[1] == null ? 0 : taskId[1] + 1

        let prevParent, prevChild

        if(child === 0) {
            if(parent === 0) return [null, null] as [number, number]
            prevParent = parent-1
            prevChild = this.props.tasks[prevParent].children.length
        } else {
            prevParent = parent
            prevChild = child - 1
        }
        prevChild = prevChild ? prevChild - 1 : null
        return [prevParent, prevChild] as [number, number]
    }

    /**
     * sequence for prevChild: -1  , 0, 1, 2, 3, -1  , -1  , 0, 1, 2, 3, -1
     *                         0     0, 0, 0, 0, 1,    2,    2, 2, 2, 2, 3
     * @param taskId 
     * @returns 
     */
    getNextTask = (taskId: [number, number]) => {
        const curr = this.getTask(taskId)
        const parent = taskId[0]
        const child  = taskId[1] == null ? 0 : taskId[1] + 1

        let nextParent, nextChild

        nextChild  = (child + 1) % (curr.children.length + 1)
        nextParent = parent + Number(nextChild === 0)

        nextChild  = nextChild ? nextChild - 1 : null

        if(nextParent === this.props.tasks.length) nextParent = null
            
        return [nextParent, nextChild] as [number, number]
    }

    handleChangeActiveTask = (taskPointer: [number, number]) => {
        // IMPORTANT: order matters here
        // buffer must be created before the render triggered by setState
        this.replayIndex = 0
        this.instructionsFn = null
        this.setState({
            currTask: taskPointer,
            currKey: this.state.currKey + 1
        })
        this.updateUrl(taskPointer[0])
    }

    gotoNextTask = () => {
        // if done with tasks
        if (this.state.currTask[0] === this.state.taskIds.length - 1 &&
            (this.state.currTask[1] !== null ? this.state.currTask[1] === this.state.taskIds[this.state.currTask[0]][1].length - 1 : true)) {
            this.handleHitSubmit()
        } else {
            // go to next task
            this.handleChangeActiveTask(this.getNextTask(this.state.currTask))
        }
    }

    prerequisitesCompleted = () => {
        let prerequisitesCompleted = true
        Object.values(this.props.tasks).forEach(t => {
            if(t.prerequisite && !t.valid) prerequisitesCompleted = false 
        })
        return prerequisitesCompleted
    }

    handleTaskSubmitted = (valid: any, gotoNext=false) => {
        const prerequisitesCompleted = this.prerequisitesCompleted()
        if(!this.state.prerequisitesCompleted && prerequisitesCompleted) {
            // prerequisites were just completed
            return this.props.reloadHit(()=>{
                if(gotoNext) this.gotoNextTask()
            })
        }
        
        if(gotoNext) this.gotoNextTask()
    }

    updateUrl = (taskIndex: number) => {
        if(this.props.routingEnabled) {
            window.history.pushState(null, null, '#' + generatePath(this.props.match.path, {
                hitId: this.props.match.params.hitId,
                taskId: taskIndex
            }))
        }
    }

    

    handleMenuClick = (e: any) => {
        if (e.key == 'extra') this.setState({extraOpen: !this.state.extraOpen})
    }

    showCompletionInfo = () => {
        const config = this.props.completionInfo
        return Modal.success({
            title: 'HIT submitted!',
            content: <>
                <p>Thank you! Your work has been submitted.</p>
                <p>Your completion code is:</p>
                <pre>{config.completionCode}</pre>
                {config.redirect && !!config.redirect.length &&
                    <>
                        <p>If you came from one of these crowdsourcing sites, you may also click here to be redirected:</p>
                        {config.redirect.map(r => {
                            return <Button type='primary' icon={<ArrowRightOutlined />} href={r.url}>Back to {r.name}</Button>
                        })}
                    </>
                }
            </>
        })
    }

    handleHitSubmit = () => {
        this.props.onSubmit()
            .then(()=>{
                this.showCompletionInfo()
            })
            .catch(err=>{
                myerror('Error submitting HIT. Please try again or contact the organizers.', err)
            })
    }

    /**
     * True if the hit can be submitted:
     * - all required tasks have a valid response
     */
    canSubmitHit = () => {
        for (const task of Object.values(this.props.tasks)) {
            if(task.required && !task.valid) return false
        }
        return true
    }

    renderMenu = () => {
        const tasks = this.state.taskIds.map(row => {
            const children = row[1].map(childId => this.props.tasks[childId])
            const parent = this.props.tasks[row[0]]
            parent.children = children
            return parent
        })

        return <>
            
            <Sidebar
                tasks={tasks}
                currTask={this.state.currTask}
                onChangeActiveTask={this.handleChangeActiveTask}
                editMode={{
                    enabled: true,
                    allowNew: ('userTasks' in this.props.interface && Object.entries(this.props.interface.userTasks).length > 0),
                    presets: this.props.interface.userTasks,
                    onTaskEdit: this.handleTaskEdit,
                    onTaskCreate: this.handleTaskCreate,
                    onTaskDelete: this.handleTaskDelete,
                }}>
                {!this.props.submitted && this.props.interface.showSubmitButton &&
                    <Button type="primary" 
                            style={{width: '100%', backgroundColor: '#5b8c00', borderColor: '#5b8c00'}} 
                            onClick={this.handleHitSubmit}
                            disabled={!this.canSubmitHit()}>Submit HIT</Button>
                }
                {this.props.submitted &&
                    <Button type="primary" style={{width: '100%', backgroundColor: '#5b8c00', borderColor: '#5b8c00'}} onClick={this.showCompletionInfo}>Show completion code</Button>
                }
            </Sidebar>
        </>
    }

    getHitExtra = () => {
        if (this.props.extra) return <MarkdownLoader content={this.props.extra} />
        else return false
    }

    renderTaskSubmitButton = (extraProps: any) => {
        return <Button type="primary" htmlType="submit" {...extraProps}>
            {this.props.interface.type == 'annotation' ? 'Submit' : 'Next'}
        </Button>
    }

    renderTaskNextButton = (extraProps: any) => {
        return <Button type="primary" onClick={this.gotoNextTask} {...extraProps}>
            Next
        </Button>
    }

    

    render() {
        console.log(this.state.currTask)
        const taskProps = this.getTask(this.state.currTask)
        const parentProps = this.state.currTask[1] != null ? 
                            this.getTask([this.state.currTask[0], null]) : 
                            null

        const hitExtra = this.getHitExtra()

        return <>
            <Menu onClick={this.handleMenuClick} mode="horizontal" theme="dark" style={{position: 'sticky', top: 0, width: '100%'}}>
                <Menu.Item key="logo" disabled>
                    <CovfeeMenuItem/>
                </Menu.Item>
                <Menu.Item key="task" disabled>
                    <Text strong style={{ color: 'white' }}>{taskProps.spec.name}</Text>
                </Menu.Item>
                {hitExtra && 
                <Menu.Item key="extra" icon={<PlusOutlined />}>Extra</Menu.Item>}
            </Menu>
            <SidebarContainer height={this.props.height}>
                {this.renderMenu()}
            </SidebarContainer>
            <ContentContainer>
                
                {hitExtra &&
                    <Collapsible open={this.state.extraOpen}>
                        <Row>
                            <Col span={24}>{hitExtra}</Col>                    
                        </Row>
                    </Collapsible>}
                <Row>
                    
                    {this.props.interface.showProgress &&
                    <div style={{margin: '5px 15px'}}>
                        {(()=>{
                            const num_valid = Object.values(this.props.tasks).filter(t=>t.valid).length
                            const num_steps = Object.values(this.props.tasks).length
                            return <Progress
                                percent={100 * num_valid / num_steps}
                                // steps={Object.alues(this.props.tasks).length}
                                format={p => {return num_valid + '/' + num_steps}}
                                trailColor={'#c0c0c0'}/>
                        })()}
                    </div>}
                    <TaskLoader
                        key={this.state.currKey}
                        task={taskProps}
                        parent={parentProps}
                        interfaceMode={this.props.interface.type}
                        disabled={(taskProps.maxSubmissions ? (taskProps.num_submissions >= taskProps.maxSubmissions) : false) || (taskProps.prerequisite && taskProps.valid)}
                        previewMode={this.props.previewMode}
                        // render props
                        renderTaskSubmitButton={this.renderTaskSubmitButton}
                        renderTaskNextButton={this.renderTaskNextButton}
                        // async operations
                        fetchTaskResponse={this.props.fetchTaskResponse}
                        submitTaskResponse={this.props.submitTaskResponse}
                        // callbacks
                        onClickNext={this.gotoNextTask}
                        onSubmit={this.handleTaskSubmitted}/>
                </Row>
            </ContentContainer>            
        </>
    }
}



const SidebarContainer = styled.div`
    position: sticky;
    display: inline-block;
    vertical-align: top;
    top:46px;
    height: ${props => (Math.floor(props.height) - 46 + 'px;')}
	width: 25%;
	overflow: auto;
`

const ContentContainer = styled.div`
    display: inline-block;
    vertical-align: top;
    width: calc(100% - 25%);
    overflow: auto;
`

const HitWithRouter = withRouter(Hit)
export default HitWithRouter