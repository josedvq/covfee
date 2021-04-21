import * as React from 'react'
import {unstable_batchedUpdates} from 'react-dom'
import { withRouter, generatePath, RouteComponentProps } from 'react-router'
import {
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
} from 'antd';
const { Panel } = Collapse
import Collapsible from 'react-collapsible'
const { Text } = Typography

import Constants from 'Constants'
import { myerror, fetcher, throwBadResponse} from '../utils'
import { MarkdownLoader} from '../tasks/instructions'
import {CovfeeMenuItem} from '../gui'
import {Sidebar} from './sidebar'

import { HitType } from '@covfee-types/hit'
import { EditableTaskFields, TaskSpec, TaskType } from '@covfee-types/task'
import { TaskLoader } from './task_loader';

interface MatchParams {
    hitId: string,
    taskId: string
}

type HitProps = HitType & RouteComponentProps<MatchParams> & {
    /**
     * Enables preview mode where data submission is disabled.
     */
    previewMode: boolean,
    /**
     * Tells the annotation component to keep urls up to date
     */
    routingEnabled: boolean
    /**
     * Called when the Hit submit button is clicked
     */
    onSubmit: () => Promise<any>
}

interface HitState {
    /**
     * Index of the currently selected task.
     * The first number points to a parent task
     * The second number, if not null, points to a child task within the parent
     */
    currTask: [number, number]
    /**
     * True if currTask is currently being loaded
     */
    loadingTask: boolean
    /**
     * Holds the state of the sidebar with the list of tasks
     */
    sidebar: {
        /**
         * taskIds that are being displayed.
         * The first number is the parent number and points to this.tasks
         * The second number is the child number and points to the children list within each parent.
         */
        taskIds: [number, number[]][]
    },
    /**
     * Used to trigger remounting of tasks
     */
    currKey: number
    /**
     * State of "extra" collapsible with hit-level information
     */
    extraOpen: boolean
}


export class Hit extends React.Component<HitProps, HitState> {
    state:HitState = {
        currTask: null,
        loadingTask: true,
        sidebar: {
            taskIds: []
        },
        extraOpen: false,
        currKey: 0
    }

    url: string
    tasks: Array<any>
    taskKeys: Array<string>
    instructionsFn: Function = null

    replayIndex = 0

    static defaultProps = {
        interface: {
            userTasks: {},
            showProgress: false,
        }
    }

    constructor(props: HitProps) {
        super(props)
        // copy props into tasks
        this.url = Constants.api_url + '/instances/' + this.props.id
        this.tasks = this.props.tasks

        // calculate the current task using the route and the HIT
        let parentTask = 0
        if (props.match !== undefined && props.match.params.taskId !== undefined && this.tasks.length < parseInt(props.match.params.taskId)) {
            parentTask = parseInt(props.match.params.taskId)
        }

        // Initialize the sidebar state
        this.state = {
            ...this.state,
            currTask: [parentTask, null],
            sidebar: {
                'taskIds': this.makeSidebarTaskIds()
            }
        }        
    }

    makeSidebarTaskIds = () => {
        const taskIds = this.props.tasks.map((task, idx) => {
            const childrenIndices = task.children.map((_, i) => i)
            return [idx, childrenIndices] as [number, number[]]
        })
        return taskIds
    }

    isTimeline = () => {return (this.props.type == 'timeline')}

    componentDidMount() {
        // run fetches that update state
        this.handleChangeActiveTask(this.state.currTask)
    }

    getTask = (taskId: [number, number]) => {
        if(taskId[1] == null) {
            return this.tasks[taskId[0]]
        } else {
            return this.tasks[taskId[0]].children[taskId[1]]
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
            prevChild = this.tasks[prevParent].children.length
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

        if(nextParent === this.tasks.length) nextParent = null
            
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
        const curr = this.getTask(this.state.currTask)
        // if done with tasks
        if (this.state.currTask[0] === this.tasks.length - 1 &&
            this.state.currTask[1] === curr.children.length) {
            this.handleHitSubmit()
        } else {
            // go to next task
            this.handleChangeActiveTask(this.getNextTask(this.state.currTask))
        }
    }

    handleTaskSubmit = () => {
        console.log('task submitted')
    }

    updateUrl = (taskIndex: number) => {
        if(this.props.routingEnabled) {
            window.history.pushState(null, null, '#' + generatePath(this.props.match.path, {
                hitId: this.props.match.params.hitId,
                taskId: taskIndex
            }))
        }
    }

    handleTaskDelete = (taskId: [number, number]) => {
        // deleting existing task
        const curr = this.getTask(taskId)
        const url = Constants.api_url + '/tasks/' + curr.id + '/delete'

        return fetch(url)
            .then(throwBadResponse)
            .then(_ => {
                if(taskId[1] == null)
                    this.tasks.splice(taskId[0], 1)
                else
                    curr.children.splice(taskId[1], 1)

                unstable_batchedUpdates(() => {
                    this.setState({
                        sidebar: { taskIds: this.makeSidebarTaskIds() }
                    })
                    if(this.tasks.length === 0) return
                    let nextTask = this.getPrevTask(this.state.currTask)
                    if (nextTask[0] == null) nextTask = this.getNextTask(this.state.currTask)
                    this.handleChangeActiveTask(nextTask)
                })
            })
            .catch(error => {
                myerror('Error deleting the task.', error)
            })
    }

    handleTaskEdit = (taskId: [number, number], task: EditableTaskFields) => {
        if(taskId[0] == null) return
        // editing existing task
        const curr = this.getTask(taskId)
        const url = Constants.api_url + '/tasks/' + curr.id + '/edit'
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task)
        }

        return fetch(url, requestOptions)
            .then(throwBadResponse)
            .then(data => {
                if(taskId[1] != null)
                    this.tasks[taskId[0]].children[taskId[1]] = data
                else
                    this.tasks[taskId[0]] = {
                        ...data,
                        children: this.tasks[taskId[0]].children
                    }
                this.setState(this.state)
            })
            .catch(error => {
                myerror('Error creating the new task.', error)
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
                let pid: number , cid: number
                console.log(parentId)
                if(parentId == null) {
                    console.log(data)
                    this.tasks.push(data)
                    pid = this.tasks.length - 1
                    cid = null
                } else {
                    pid = parentId
                    cid = 0
                    this.tasks[parentId].children.push(data)
                }
                this.setState({
                    sidebar: { taskIds: this.makeSidebarTaskIds() }
                }, () => {
                    this.handleChangeActiveTask([pid, cid])
                })
            })
            .catch(error => {
                myerror('Error creating the new task.', error)
            })
    }

    handleMenuClick = (e: any) => {
        if (e.key == 'extra') this.setState({extraOpen: !this.state.extraOpen})
    }

    handleHitSubmit = () => {
        this.props.onSubmit()
            .then(hit=>{
                Modal.success({
                    title: 'HIT submitted!',
                    content: <>
                        <p>Thank you. Your work has been submitted.</p>
                        <p>Your completion code is:</p>
                        <pre>{hit.completion_code}</pre>
                    </>
                })
            })
            .catch(err=>{
                myerror('Error submitting HIT. Please try again later or contact the organizers.', err)
            })
    }

    renderMenu = () => {
        if(this.props.type !== 'annotation') return
        const tasks = this.state.sidebar.taskIds.map(row => this.tasks[row[0]])
        return <>
            <Collapse defaultActiveKey={1}>
                <Panel header={this.props.name} key="1">
                    <Button type="link" onClick={this.handleHitSubmit}>Submit HIT</Button>
                </Panel>
            </Collapse>
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
                }}/>
        </>
    }

    getHitExtra = () => {
        if (this.props.extra) return <MarkdownLoader content={this.props.extra} />
        else return false
    }

    render() {
        const taskProps = this.getTask(this.state.currTask)
        const parentProps = this.state.currTask[1] != null ? 
                            this.getTask([this.state.currTask[0], null]) : 
                            null

        const hitExtra = this.getHitExtra()

        return <div className="tool-container">
            <Row>
                <Col span={24}>
                    <Menu onClick={this.handleMenuClick} mode="horizontal" theme="dark">
                        <Menu.Item disabled>
                            <CovfeeMenuItem/>
                        </Menu.Item>
                        <Menu.Item key="task" disabled>
                            <Text strong style={{ color: 'white' }}>{taskProps.spec.name}</Text>
                        </Menu.Item>
                        {hitExtra && 
                        <Menu.Item key="extra" icon={<PlusOutlined />}>Extra</Menu.Item>}
                    </Menu>
                    
                </Col>
            </Row>
            {hitExtra &&
                <Collapsible open={this.state.extraOpen}>
                    <Row>
                        <Col span={24}>{hitExtra}</Col>                    
                    </Row>
                </Collapsible>}
            {this.props.interface.showProgress &&
            <Row>
                <Col span={24}>
                        <Progress
                            percent={100 * this.state.currTask[0] / this.tasks.length}
                            // steps={this.tasks.length}
                            showInfo={false}/>
                </Col>
            </Row>}
            <Row>
                <Col span={20}>
                    <TaskLoader
                        key={this.state.currKey}
                        task={taskProps}
                        parent={parentProps}
                        previewMode={this.props.previewMode}
                        onSubmit={this.handleTaskSubmit} />
                </Col>
                <Col span={4}>
                    {this.renderMenu()}
                </Col>
            </Row>
        </div>
    }
}

const HitWithRouter = withRouter(Hit)
export default HitWithRouter