import * as React from 'react'
import {unstable_batchedUpdates} from 'react-dom'
import { withRouter, generatePath, RouteComponentProps } from 'react-router'
import {
    QuestionCircleOutlined,
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
    Popover,
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
     * Points to the task specs held outside of the state
     */
    currTask: number
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
         * Point to the task specs held outside of the state
         */
        taskIds: Array<number>
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
        let currTask = 0
        if (props.match !== undefined && props.match.params.taskId !== undefined && this.tasks.length < parseInt(props.match.params.taskId)) {
            currTask = parseInt(props.match.params.taskId)
        }
        
        this.state = {
            ...this.state,
            currTask: currTask,
            sidebar: {
                taskIds: [...this.tasks.keys()]
            }
        }        
    }

    isTimeline = () => {return (this.props.type == 'timeline')}

    componentDidMount() {
        // run fetches that update state
        this.handleChangeActiveTask(this.state.currTask)
    }

    handleChangeActiveTask = (taskIndex: number) => {
        // IMPORTANT: order matters here
        // buffer must be created before the render triggered by setState
        this.replayIndex = 0
        this.instructionsFn = null
        this.setState({
            currTask: taskIndex,
            currKey: this.state.currKey + 1
        })
        this.updateUrl(taskIndex)
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

    gotoNextTask = () => {
        // if done with tasks
        if (this.state.currTask == this.tasks.length - 1) {
            this.handleHitSubmit()
        } else {
            // go to next task
            const nextTaskIndex = this.state.currTask + 1
            this.setState({
                currTask: nextTaskIndex,
                currKey: this.state.currKey+1
            })
            this.updateUrl(nextTaskIndex)
        }
    }    

    handleTaskDelete = (taskIndex: number) => {
        // deleting existing task
        const taskId = this.tasks[taskIndex].id
        const url = Constants.api_url + '/tasks/' + taskId + '/delete'

        return fetch(url)
            .then(throwBadResponse)
            .then(data => {
                this.tasks.splice(taskIndex, 1)
                const newTaskIds = [...this.tasks.keys()]
                unstable_batchedUpdates(() => {
                    this.setState({
                        sidebar: { taskIds: newTaskIds }
                    })
                    this.handleChangeActiveTask(Math.max(0, this.state.currTask-1) - 1)
                })
            })
            .catch(error => {
                myerror('Error deleting the task.', error)
            })
    }

    handleTaskEdit = (taskIndex: number, task: EditableTaskFields) => {
        // editing existing task
        const taskId = this.tasks[taskIndex].id
        const url = Constants.api_url + '/tasks/' + taskId + '/edit'
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task)
        }

        return fetch(url, requestOptions)
            .then(throwBadResponse)
            .then(data => {
                this.tasks[taskIndex] = data
            })
            .catch(error => {
                myerror('Error creating the new task.', error)
            })
    }

    handleTaskCreate = (task: EditableTaskFields) => {
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
                this.tasks.push(data)
                const newTaskIds = [...this.tasks.keys()]
                this.setState({
                    sidebar: { taskIds: newTaskIds }
                }, () => {
                    this.handleChangeActiveTask(this.tasks.length - 1)
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
        const tasks = this.state.sidebar.taskIds.map(taskId => this.tasks[taskId])
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
        if(this.state.loadingTask) return false
        
        if (this.props.extra) return <MarkdownLoader content={this.props.extra} />
        else return false
    }

    render() {
        const taskProps = this.tasks[this.state.currTask]
        const taskUrl = this.url + '/tasks/' + taskProps.id
        const hitExtra = this.getHitExtra()

        return <div className="tool-container">
            <Row>
                <Col span={24}>
                    <Menu onClick={this.handleMenuClick} mode="horizontal" theme="dark">
                        <Menu.Item disabled>
                            <CovfeeMenuItem/>
                        </Menu.Item>
                        <Menu.Item key="task" disabled>
                            <Text strong style={{ color: 'white' }}>{taskProps.name}</Text>
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
                            percent={100 * this.state.currTask / this.tasks.length}
                            // steps={this.tasks.length}
                            showInfo={false}/>
                </Col>
            </Row>}
            <Row>
                <Col span={20}>
                    <TaskLoader 
                        task={taskProps}
                        url={taskUrl} 
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