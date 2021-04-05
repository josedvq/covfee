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
    Input,
    Button, 
    Modal,
    Collapse,
    Popover,
    Progress
} from 'antd';
const { Panel } = Collapse
import Collapsible from 'react-collapsible'
const { Text } = Typography

import classNames from 'classnames'
import Constants from 'Constants'
import { myerror, fetcher, throwBadResponse} from '../utils'
import { getTaskClass, NewTaskModal} from '../task_utils'
import { Buffer, EventBuffer, DummyBuffer } from '../buffer'
import { MarkdownLoader} from '../tasks/instructions'
import KeyboardManagerContext from '../input/keyboard_manager'
import {CovfeeMenuItem} from '../gui'
import {TaskGroup} from './sidebar'
import {getFullscreen, closeFullscreen} from '../utils'




interface TimelineInterfaceProps {
    showProgress?: boolean,
}

interface AnnotationInterfaceProps {
    showMenu?: boolean,
    userTasks?: any,
}

interface HitProps extends RouteComponentProps {
    previewMode: boolean,
    type: string,
    id: string,
    name: string,
    project: object,
    submitted: boolean,
    tasks: Array<any>
    interface: TimelineInterfaceProps | AnnotationInterfaceProps
    /**
     * Tells the annotation component to keep urls up to date
     */
    routingEnabled: boolean
}

interface HitState {
    /**
     * Index of the currently selected task
     */
    currTask: number
    loadingTask: boolean
    error: string
    completionCode: string
    sidebar: {
        taskIds: Array<number>
    },
    extraOpen: boolean
    fullscreen: boolean
    submittingTask: boolean
    editTaskModal: {
        taskId: number
        visible: boolean
        new: boolean
    },
    errorModal: {
        visible: boolean
        message: string
        loading: boolean
    },
    submitModal: {
        visible: boolean
    },
    overlay: {
        visible: boolean
        submitted: boolean
        submitting: boolean
    },
    replay: {
        dataIndex: number
        enabled: boolean
    },
    currKey: number
}


class Hit extends React.Component<HitProps, HitState> {
    state:HitState = {
        currTask: null,
        loadingTask: true,
        error: null,
        completionCode: null,
        sidebar: {
            taskIds: []
        },
        extraOpen: false,
        fullscreen: false,
        submittingTask: false,
        editTaskModal: {
            taskId: null,
            visible: false,
            new: false
        },
        errorModal: {
            visible: false,
            message: '',
            loading: false
        },
        submitModal: {
            visible: false
        },
        overlay: {
            visible: false,
            submitted: false,
            submitting: false,
        },
        replay: {
            enabled: false,
            dataIndex: 0
        },
        currKey: 0 // for re-mounting components
    }
    url: string
    tasks: Array<any>
    taskKeys: Array<string>
    buffer: Buffer
    container = React.createRef<HTMLDivElement>()
    taskRef = React.createRef<React.Component>()
    instructionsFn: Function = null

    replayIndex = 0

    static defaultProps = {
        interface: {
            userTasks: {},
            showProgress: false,
            showMenu: true,
        }
    }

    constructor(props: HitProps) {
        super(props)
        // copy props into tasks
        this.url = Constants.api_url + '/instances/' + this.props.id
        this.tasks = this.props.tasks

        // calculate the current task using the route and the HIT
        let currTask = 0
        if (props.match.params.taskId !== undefined && this.tasks.length < parseInt(props.match.params.taskId)) {
            currTask = parseInt(props.match.params.taskId)
        }
        
        this.state = {
            ...this.state,
            'currTask': currTask,
            sidebar: {
                taskIds: [...this.tasks.keys()]
            }
        }        
        this.buffer = new DummyBuffer()
    }

    // componentDidUpdate = (prevProps) => {
    //     // listen to prop changes in preview mode only.
    //     if(this.props.previewMode) {
    //         this.tasks = this.props.tasks
    //     }
    // }

    isTimeline = () => {return (this.props.type == 'timeline')}

    componentDidMount() {
        document.addEventListener("keydown", this.handleKeydown, false)
        // run fetches that update state
        this.handleChangeActiveTask(this.state.currTask)
    }

    componentWillUnmount() {
        document.removeEventListener("keydown", this.handleKeydown, false)
    }

    handleKeydown = (e: KeyboardEvent) => {
        const tagName = e.target.tagName.toLowerCase()
        if(['input', 'textarea', 'select', 'button'].includes(tagName)) return
        
        switch (e.key) {
            case 'f':
                if(!this.state.fullscreen) {
                    getFullscreen(this.container.current).then(()=>{
                        this.setState({fullscreen: true})
                    })
                } else {
                    closeFullscreen().then(() => {
                        this.setState({ fullscreen: false })
                    })
                }
                break
            default:
                break
        }
    }

    handleChangeActiveTask = (taskIndex: number) => {
        // IMPORTANT: order matters here
        // buffer must be created before the render triggered by setState
        this.replayIndex = 0
        // if the task has previous responses, query them
        if(this.tasks[taskIndex].response != null) {
            this.fetchTaskResponse(taskIndex)
        } else {
        // no previous responses, prepare task
            this.loadTaskForAnnotation(taskIndex)
        }
        this.instructionsFn = null
    }

    updateUrl = (taskIndex: number) => {
        if(this.props.routingEnabled) {
            window.history.pushState(null, null, '#' + generatePath(this.props.match.path, {
                hitId: this.props.match.params.hitId,
                taskId: taskIndex
            }))
        }
    }

    fetchTaskResponse = (taskIndex: number) => {
        this.setState({ loadingTask: true })
        const url = this.url + '/tasks/' + this.tasks[taskIndex].id + '/responses?' + new URLSearchParams({
            'with_chunk_data': '1'
        })
        fetcher(url)
            .then(throwBadResponse)
            .then((data) => {
                this.tasks[taskIndex].response = data
                this.startNewBuffer(taskIndex)
                this.setState({
                    loadingTask: false,
                    currTask: taskIndex,
                    overlay: {
                        ...this.state.overlay,
                        visible: !this.isTimeline(),
                        submitted: true
                    },
                    currKey: this.state.currKey + 1
                })

                this.updateUrl(taskIndex)
                
            }).catch(error => {
                myerror('Error fetching task response.', error)
            })
    }

    startNewBuffer = (taskId: string, dummy: boolean = false) => {
        if (dummy) {
            this.buffer = new DummyBuffer()
            return
        }

        this.buffer = new EventBuffer(
            2000,
            this.url + '/tasks/' + taskId + '/chunk',
            this.handleBufferError)
    }
    

    // Overlay actions
    loadTaskForReplay = (taskIndex: number) => {
        this.startNewBuffer(this.tasks[taskIndex].id, true)
        this.setState({
            currTask: taskIndex,
            loadingTask: false,
            overlay: {
                ...this.state.overlay,
                visible: false
            },
            replay: {
                ...this.state.replay,
                enabled: true
            },
            currKey: this.state.currKey + 1
        }, () => {
            this.replayIndex = 0
        })
        this.updateUrl(taskIndex)
    }

    loadTaskForAnnotation = (taskIndex: number) => {
        this.startNewBuffer(this.tasks[taskIndex].id, this.props.previewMode) // dummy buffer for preview
        this.setState({
            currTask: taskIndex,
            loadingTask: false,
            overlay: {
                ...this.state.overlay,
                visible: false
            },
            replay: {
                ...this.state.replay,
                enabled: false
            },
            currKey: this.state.currKey + 1
        })
        this.updateUrl(taskIndex)
    }

    handleTaskReplay = () => {
        this.loadTaskForReplay(this.state.currTask)
    } 

    handleTaskRedo = () => {
        this.loadTaskForAnnotation(this.state.currTask)
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

    handleTaskSubmit = (taskResult: any) => {
        if(this.props.previewMode) {
            this.setState({
                overlay: {
                    ...this.state.overlay,
                    submitted: true
                }
            })
            this.gotoNextTask()
            return
        }

        let sendResult = () => {
            const url = this.url + '/tasks/' + this.tasks[this.state.currTask].id + '/submit?' + new URLSearchParams({
                'with_chunk_data': '1'
            })

            const requestOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskResult)
            }

            // now send the task results
            return fetch(url, requestOptions)
        }

        if(!this.buffer.receivedData) {
            // non-continuous task
            sendResult()
            .then(throwBadResponse)
            .then(data => {
                this.tasks[this.state.currTask].response = data
                this.setState({
                    overlay: {
                        ...this.state.overlay,
                        submitting: false,
                        submitted: true
                    }
                })
                if(this.isTimeline()) {
                    this.gotoNextTask()
                }
            }).catch((error) => {
                myerror('Error submitting the task.', error)
                this.setState({
                    overlay: {
                        ...this.state.overlay,
                        submitting: false
                    }
                })
            })
        } else {
            // continuous task sent data to the buffer
            this.setState({
                overlay: {
                    ...this.state.overlay,
                    submitting: true
                }
            })
            // wait for the buffer queue to be sent
            this.buffer.attemptBufferSubmit(true)
            this.buffer.awaitQueueClear(3000)
            .then(sendResult)
            .then(throwBadResponse)
            .then(data => {
                this.tasks[this.state.currTask].response = data
                this.setState({
                    overlay: {
                        ...this.state.overlay,
                        submitting: false,
                        submitted: true
                    }
                })
                if (this.isTimeline()) {
                    this.gotoNextTask()
                }
            }).catch((error) => {
                myerror('Error submitting the task.', error)
                this.setState({
                    overlay: {
                        ...this.state.overlay,
                        submitting: false
                    }
                })
            })
        }
    }

    handleTaskEnd = () => {
        this.setState({
            overlay: {
                visible: true,
                submitted: this.state.replay.enabled,
                submitting: false
            }
        })
    }

    /* HANDLING OF NEW TASKS AND TASK EDITION */
    handleTaskClickAdd = () => {
        if(this.props.previewMode) return
        
        this.setState({
            editTaskModal: {
                ...this.state.editTaskModal,
                taskId: null,
                visible: true,
                new: true
            }
        })
    }

    handleTaskClickEdit = (taskId: number) => {
        if (this.props.previewMode) return

        this.setState({
            editTaskModal: {
                ...this.state.editTaskModal,
                taskId: taskId,
                visible: true,
                new: false
            }
        })
    }

    handleEditTaskCancel = () => {
        this.setState({
            editTaskModal: {
                ...this.state.editTaskModal,
                visible: false,
            }
        })
    }

    handleEditTaskDelete = (taskId: number) => {
        // deleting existing task
        const url = Constants.api_url + '/tasks/' + taskId + '/delete'

        return fetch(url)
            .then(throwBadResponse)
            .then(data => {
                this.tasks.splice(this.state.editTaskModal.taskId, 1)
                const newTaskIds = [...this.tasks.keys()]
                unstable_batchedUpdates(() => {
                    this.setState({
                        sidebar: { taskIds: newTaskIds }
                    })
                    this.handleChangeActiveTask(Math.max(0, this.state.currTask-1) - 1)
                })
            })
            .catch(error => {
                myerror('Error creating the new task.', error)
            })
    }

    handleEditTaskSubmit = (task: any) => {
        
        if (this.state.editTaskModal.new) {
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
                    }, ()=>{
                        this.handleChangeActiveTask(this.tasks.length - 1)
                    })
                })
                .catch(error => {
                    myerror('Error creating the new task.', error)
                })
        } else {
            // editing existing task
            const url = Constants.api_url + '/tasks/' + task.id + '/edit'
            const requestOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(task)
            }

            return fetch(url, requestOptions)
                .then(throwBadResponse)
                .then(data => {
                    this.tasks[this.state.editTaskModal.taskId] = data
                })
                .catch(error => {
                    myerror('Error creating the new task.', error)
                })
        }
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

    // Buffer error handling
    handleBufferError = (msg: string) => {
        this.handlePausePlay(true)
        this.setState({
            errorModal: {
                ...this.state.errorModal,
                visible: true,
                message: msg
            }
        })
    }

    handleErrorOk = () => {
        const modalMessage = 'Attempting to submit. The window will be closed if successful.'
        this.setState({
            errorModal: {
                visible: true,
                message: modalMessage,
                loading: true
            }
        })

        this.buffer.attemptBufferSubmit()
        this.buffer.awaitQueueClear(5000).then(() => {
            this.setState({ errorModal: { ...this.state.errorModal, visible: false, loading: false } })
        }).catch(() => {
            this.setState({
                errorModal: {
                    visible: true,
                    message: modalMessage + ' Unable to send the data. Please communicate with the organizers if the problems persist.',
                    loading: false
                }
            })
        })
    }

    handleErrorCancel = () => {
        this.setState({
            errorModal: {
                ...this.state.errorModal,
                visible: false
            }
        })
    }

    // replay logic
    getNextReplayAction = () => {
        this.replayIndex += 1
        return this.getCurrReplayAction()
    }

    getCurrReplayAction = () => {
        const response = this.tasks[this.state.currTask].response
        if (response == null ||
            response.chunk_data == null) {
            return null
        }

        if (this.replayIndex < response.chunk_data.length)
            return response.chunk_data[this.replayIndex]
        else
            return null
    }

    renderAnnotationMenu = () => {
        const tasks = this.state.sidebar.taskIds.map(taskId => this.tasks[taskId])
        return <>
            <Collapse defaultActiveKey={1}>
                <Panel header={this.props.name} key="1">
                    <Button type="link" onClick={this.handleHitSubmit}>Submit HIT</Button>
                </Panel>
            </Collapse>
            <TaskGroup
                tasks={tasks}
                allowNewTasks={'userTasks' in this.props.interface && Object.entries(this.props.interface.userTasks).length > 0}
                currTask={this.state.currTask}
                onClickAdd={this.handleTaskClickAdd}
                onClickEdit={this.handleTaskClickEdit}
                onChangeActiveTask={this.handleChangeActiveTask} />
        </>
    }

    renderTimelineMenu = () => {
        const tasks = this.state.sidebar.taskIds.map(taskId => this.tasks[taskId])
        return <></>
    }

    renderOverlay = () => {
        return <div className={classNames('task-container')}>
            <div className={classNames('task-overlay', { 'task-overlay-off': !this.state.overlay.visible })}>
                <div className="task-overlay-nav">
                    <Button onClick={this.handleTaskReplay} disabled={!this.state.overlay.submitted}>Replay</Button>
                    <Button onClick={this.handleTaskRedo}>Re-do</Button>
                    <Button onClick={() => { this.handleTaskSubmit({}) }}
                        type="primary"
                        disabled={this.state.overlay.submitted || this.state.replay.enabled}
                        loading={this.state.overlay.submitting}
                    >Submit</Button>
                </div>
            </div>
        </div>
    }

    renderErrorModal = () => {
        return <Modal
            title="Error"
            visible={this.state.errorModal.visible}
            confirmLoading={this.state.errorModal.loading}
            onOk={this.handleErrorOk}
            onCancel={this.handleErrorCancel}
            cancelButtonProps={{ disabled: true }}
            okButtonProps={{}}
        >
            <p>{this.state.errorModal.message}</p>
        </Modal>
    }

    handleSetTaskInstructionsFn = (instructionsFn: Function) => {
        this.instructionsFn = instructionsFn
        this.setState(this.state)
    }

    renderTask = (props) => {
        if(this.state.loadingTask) return <></>

        const taskClass = getTaskClass(props.type)
        const task = React.createElement(taskClass, {
            key: this.state.currKey,
            ref: this.taskRef,
            setInstructionsFn: this.handleSetTaskInstructionsFn,

            // Annotation task props
            buffer: this.buffer.data,
            onEnd: this.handleTaskEnd,
            onSubmit: this.handleTaskSubmit,

            // Replayable task props
            replayMode: this.state.replay.enabled,
            getNextReplayAction: this.getNextReplayAction,
            getCurrReplayAction: this.getCurrReplayAction,
            ...props
        }, null)

        return task
    }

    getTaskInfo = (task) => {
        if(this.state.loadingTask) return null

        let taskInfo = null
        if(this.instructionsFn != null) {
            taskInfo = this.instructionsFn()
        }
        return taskInfo
    }

    getHitExtra = (task) => {
        if(this.state.loadingTask) return false
        
        if (this.props.extra) return <MarkdownLoader {...this.props.extra} />
        else return false
    }

    renderAnnotation = () => {
        let props = this.tasks[this.state.currTask]
        props._url = this.url + '/tasks/' + props.id
        
        const task = this.renderTask(props)
        const taskInfo = this.getTaskInfo(task)
        const taskExtra = this.getHitExtra(task)

        return <div className="tool-container" ref={this.container}>

            <NewTaskModal
                {...this.state.editTaskModal}
                presets={'userTasks' in this.props.interface ? this.props.interface.userTasks : {}}
                task={this.state.editTaskModal.taskId != null ? this.tasks[this.state.editTaskModal.taskId] : {}}
                onSubmit={this.handleEditTaskSubmit}
                onCancel={this.handleEditTaskCancel}
                onDelete={this.handleEditTaskDelete}/>
            <Row>
                <Col span={24}>
                    <Menu onClick={this.handleMenuClick} mode="horizontal" theme="dark">
                        <Menu.Item disabled>
                            <CovfeeMenuItem/>
                        </Menu.Item>
                        <Menu.Item key="task" disabled>
                            <Text strong style={{ color: 'white' }}>{props.name}</Text>
                        </Menu.Item>
                        {taskInfo ?
                        <Menu.Item key="keyboard" style={{ padding: '0' }}>
                            <Popover
                                placement="bottom"
                                content={<div style={{ width: '400px' }}>
                                    {taskInfo}
                                </div>}
                                trigger="hover">
                                <div style={{ width: '100%', padding: '0 20px' }}>
                                    <QuestionCircleOutlined />Controls
                                </div>
                            </Popover>
                        </Menu.Item> : <></>}
                        {taskExtra?
                        <Menu.Item key="extra" icon={<PlusOutlined />}>Extra</Menu.Item>
                        :<></>}
                    </Menu>
                    
                </Col>
            </Row>
            
            {taskExtra?
                <Collapsible open={this.state.extraOpen}>
                    <Row>
                        <Col span={24}>{taskExtra}</Col>                    
                    </Row>
                </Collapsible>:<></>}
            <Row>
                <Col span={20}>
                    {this.renderOverlay()}
                    <KeyboardManagerContext>{task}</KeyboardManagerContext>
                </Col>
                <Col span={4}>
                    {this.renderAnnotationMenu()}
                </Col>
            </Row>
            {this.renderErrorModal()}
        </div>
    }

    renderTimeline = () => {
        let props = this.tasks[this.state.currTask]
        props._url = this.url + '/tasks/' + props.id

        const task = this.renderTask(props)
        const taskInfo = this.getTaskInfo(task)

        return <div className="tool-container" ref={this.container}>
            <Row>
                <Col span={24}>
                    <Menu onClick={this.handleMenuClick} mode="horizontal" theme="dark">
                        <Menu.Item disabled>
                            <CovfeeMenuItem/>
                        </Menu.Item>
                        {taskInfo ?
                            <Menu.Item key="keyboard" style={{ padding: '0' }}>
                                <Popover
                                    placement="bottom"
                                    content={<div style={{ width: '400px' }}>
                                        {taskInfo}
                                    </div>}
                                    trigger="hover">
                                    <div style={{ width: '100%', padding: '0 20px' }}>
                                        <QuestionCircleOutlined />Controls
                                </div>
                                </Popover>
                            </Menu.Item> : <></>}
                    </Menu>
                </Col>
            </Row>
            <Row>
                <Col span={24}>
                {this.props.interface.showProgress?
                    <Progress 
                        percent={100 * this.state.currTask / this.tasks.length} 
                        // steps={this.tasks.length}
                        showInfo={false}
                        />:
                    <></>
                }
                </Col>

                <Col span={24}>
                    {this.renderOverlay()}
                    {task}
                </Col>
            </Row>
            {this.renderErrorModal()}
        </div>
    }

    render() {
        if(this.isTimeline()) {
            return this.renderTimeline()
        } else {
            return this.renderAnnotation()
        }
    }
}

const HitWithRouter = withRouter(Hit)
export default HitWithRouter