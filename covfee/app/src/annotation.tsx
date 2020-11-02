import * as React from 'react'
import {
    EyeFilled, 
    EditOutlined,
    CheckCircleOutlined,
    BarsOutlined,
    PictureOutlined,
    PlusCircleOutlined, LoadingOutlined, QuestionCircleOutlined, PlusOutlined
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
    Popover
} from 'antd';
const { Panel } = Collapse
import Collapsible from 'react-collapsible'
const { Text, Title, Link } = Typography

import classNames from 'classnames'
const Constants = require('./constants.json')
import { myerror, fetcher, getUrlQueryParam, throwBadResponse} from './utils'
import { getTaskClass, NewTaskModal} from './task_utils'
import { TaskSpec } from 'Tasks/task'
import { Buffer, EventBuffer, DummyBuffer } from './buffer'
import { MarkdownLoader} from './tasks/instructions'

function getFullscreen(element: HTMLElement) {
    if (element.requestFullscreen) {
        return element.requestFullscreen()
    } else if (element.mozRequestFullScreen) {
        return element.mozRequestFullScreen()
    } else if (element.webkitRequestFullscreen) {
        return element.webkitRequestFullscreen()
    } else if (element.msRequestFullscreen) {
        return element.msRequestFullscreen()
    }
}

function closeFullscreen() {
    if (document.exitFullscreen) {
        return document.exitFullscreen()
    } else if (document.mozCancelFullScreen) { /* Firefox */
        return document.mozCancelFullScreen()
    } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
        return document.webkitExitFullscreen()
    } else if (document.msExitFullscreen) { /* IE/Edge */
        return document.msExitFullscreen()
    }
}

class TaskGroup extends React.Component<any, {}> {

    render() {
        return <ol className={'task-group'}>
            {this.props.tasks.map(task => 
                <Task key={task.id} 
                    id={task.id} 
                    name={task.name} 
                    active={task.id == this.props.currTask} 
                    onActivate={this.props.onChangeActiveTask} 
                    onClickEdit={this.props.onClickEdit}/>)}
            <li>
                <Button 
                    type="primary" 
                    block={true} 
                    onClick={this.props.onClickAdd} 
                    icon={<PlusCircleOutlined />}>
                        New Task
                </Button>
            </li>
        </ol>
    }
}

class Task extends React.Component {

    handleEdit = () => {
        this.props.onClickEdit(this.props.id)
    }
    
    handleActivate = () => {
        this.props.onActivate(this.props.id)
    }

    render() {
        return <li className={classNames('task-li', { 'task-li-active': this.props.active})}>
            <Input 
                disabled={true} 
                value={this.props.name} />
            <Button icon={<EditOutlined />} onClick={this.handleEdit}></Button>
            <Button icon={<EyeFilled />} onClick={this.handleActivate}></Button>
        </li>
    }
}

interface AnnotationProps {
    previewMode: boolean,
    type: string,
    id: string,
    name: string,
    media: object,
    project: object,
    submitted: boolean,
    tasks: { [key: string]: TaskSpec }
    userTasks: any
}

interface AnnotationState {
    currTask: string,
    loadingTask: boolean,
    error: string,
    completionCode: string,
    sidebar: {
        taskIds: Array<string>
    },
    extraOpen: boolean,
    fullscreen: boolean,
    submittingTask: boolean,
    editTaskModal: {
        taskId: number,
        visible: boolean,
        new: boolean
    },
    errorModal: {
        visible: boolean,
        message: string,
        loading: boolean
    },
    overlay: {
        visible: boolean,
        submitted: boolean,
        submitting: boolean
    },
    replay: {
        dataIndex: number,
        enabled: boolean
    },
    currKey: number
}
class Annotation extends React.Component<AnnotationProps, AnnotationState> {
    state:AnnotationState = {
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
    tasks: { [key: string]: TaskSpec}
    buffer: Buffer
    container = React.createRef<HTMLDivElement>()
    taskRef = React.createRef<React.Component>()

    replayIndex = 0

    constructor(props: AnnotationProps) {
        super(props)
        // copy props into tasks
        this.url = Constants.api_url + '/instances/' + this.props.id
        this.tasks = this.props.tasks
        
        this.state = {
            ...this.state,
            currTask: Object.keys(this.tasks)[0],
            sidebar: {
                taskIds: Object.keys(this.tasks)
            }
        }        
        this.buffer = new DummyBuffer()
    }

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

    handleChangeActiveTask = (taskId: string) => {
        // IMPORTANT: order matters here
        // buffer must be created before the render triggered by setState
        
        this.replayIndex = 0
        // if the task has previous responses, query them
        if(this.tasks[taskId].response != null) {
            this.fetchTaskResponse(taskId)
        } else {
        // no previous responses, prepare task
            this.loadTaskForAnnotation(taskId)
        }   
    }

    fetchTaskResponse = (taskId: string) => {
        this.setState({ loadingTask: true })
        const url = this.url + '/tasks/' + taskId + '/responses?' + new URLSearchParams({
            'with_chunk_data': '1'
        })
        fetcher(url)
            .then(throwBadResponse)
            .then((data) => {
                this.tasks[taskId].response = data
                // this.startNewBuffer(taskId)
                this.setState({
                    loadingTask: false,
                    currTask: taskId,
                    overlay: {
                        ...this.state.overlay,
                        visible: true,
                        submitted: true
                    },
                    currKey: this.state.currKey + 1
                })

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
    loadTaskForReplay = (taskId: string) => {
        this.startNewBuffer(taskId, true)
        this.setState({
            currTask: taskId,
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
    }

    loadTaskForAnnotation = (taskId: string) => {
        this.startNewBuffer(taskId, this.props.previewMode) // dummy buffer for preview
        this.setState({
            currTask: taskId,
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
    }

    handleTaskReplay = () => {
        this.loadTaskForReplay(this.state.currTask)
    } 

    handleTaskRedo = () => {
        this.loadTaskForAnnotation(this.state.currTask)
    }

    handleTaskSubmit = (taskResult: any) => {
        this.setState({
            overlay: {
                ...this.state.overlay,
                submitting: true
            }
        })
        // wait for the buffer queue to be sent
        this.buffer.attemptBufferSubmit(true)
        this.buffer.awaitQueueClear(3000).then(() => {
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
        }).then(throwBadResponse)
        .then(data => {
            this.tasks[this.state.currTask].response = data
            this.setState({
                overlay: {
                    ...this.state.overlay,
                    submitting: false,
                    submitted: true
                }
            })
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

    handleTaskEnd = () => {
        this.setState({
            overlay: {
                visible: true,
                submitted: false,
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

    handleTaskClickEdit = (taskId: string) => {
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
                    this.tasks[data.id] = data
                    const newTaskIds = Array.from(this.state.sidebar.taskIds)
                    newTaskIds.push(data.id)
                    this.setState({
                        currTask: this.state.currTask == 'n' ? data.id : this.state.currTask,
                        sidebar: { taskIds: newTaskIds }
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
                    this.tasks[task.id] = data
                })
                .catch(error => {
                    myerror('Error creating the new task.', error)
                })
        }
    } 

    handleMenuClick = (e: object) => {
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

    render() {
        const tasks = this.state.sidebar.taskIds.map(taskId => this.tasks[taskId])
        const sidebar = <>
            <Collapse>
                <Panel header={this.props.name} key="1">
                    <Button type="link" onClick={this.handleHitSubmit}>Submit HIT</Button>
                </Panel>
            </Collapse>
            <TaskGroup 
                tasks={tasks} 
                currTask={this.state.currTask}
                onClickAdd={this.handleTaskClickAdd}
                onClickEdit={this.handleTaskClickEdit}
                onChangeActiveTask={this.handleChangeActiveTask}/>
        </>

        let props = this.tasks[this.state.currTask]
        props.url = this.url + '/tasks/' + props.id
        props.media = this.props.media
        const overlay = <div className={classNames('task-container')}>
            <div className={classNames('task-overlay', { 'task-overlay-off': !this.state.overlay.visible })}>
                <div className="task-overlay-nav">
                    <Button onClick={this.handleTaskReplay}>Replay</Button>
                    <Button onClick={this.handleTaskRedo}>Re-do</Button>
                    <Button onClick={()=>{this.handleTaskSubmit({})}} 
                        type="primary" 
                        disabled={this.state.overlay.submitted || this.state.replay.enabled} 
                        loading={this.state.overlay.submitting}
                        >Submit</Button>
                </div>
            </div>
        </div>

        const taskClass = getTaskClass(props.type)
        const task = React.createElement(taskClass, {
            key: this.state.currKey,
            ref: this.taskRef,

            // Annotation task props
            buffer: this.buffer.data,
            onEnd: this.handleTaskEnd,

            // Replayable task props
            replayMode: this.state.replay.enabled,
            getNextReplayAction: this.getNextReplayAction,
            getCurrReplayAction: this.getCurrReplayAction,                
            ...props
        }, null)

        
        let taskInfo = <></>
        if(task.ref.current && task.ref.current.hasOwnProperty('instructions')) {
            taskInfo = <Menu.Item key="keyboard" style={{ padding: '0' }}>
                <Popover 
                    placement="bottom" 
                    content={<div style={{ width: '400px' }}>
                        {task.ref.current.instructions()}
                    </div>} 
                    trigger="hover">
                    <div style={{ width: '100%', padding: '0 20px' }}>
                        <QuestionCircleOutlined/>Controls
                    </div>
                </Popover>
            </Menu.Item>
        }

        let taskExtraMenuItem = <></>
        let taskExtraCollapsible = <></>
        if(this.props.extra) {
            taskExtraMenuItem = <Menu.Item key="extra" icon={<PlusOutlined />}>Extra</Menu.Item>

            taskExtraCollapsible = <Collapsible open={this.state.extraOpen}>
                <MarkdownLoader {...this.props.extra}/>
            </Collapsible>
        }

        return <div className="tool-container" ref={this.container}>
            
            <NewTaskModal 
                {...this.state.editTaskModal} 
                presets={this.props.userTasks}
                task={this.state.editTaskModal.taskId != null ? this.tasks[this.state.editTaskModal.taskId]: null}
                onSubmit={this.handleEditTaskSubmit}
                onCancel={this.handleEditTaskCancel}/>
            <Row>
                <Col span={24}>
                    <Menu onClick={this.handleMenuClick} mode="horizontal" theme="dark">
                        <Menu.Item key="task" disabled>
                            <Text strong style={{color:'white'}}>{props.name}</Text>
                        </Menu.Item>
                        {taskInfo}
                        {taskExtraMenuItem}
                    </Menu>
                    {taskExtraCollapsible}
                </Col>
            </Row>
            <Row>
                <Col span={20}>
                    {overlay}
                    {task}
                </Col>
                <Col span={4}>
                    {sidebar}
                </Col>
            </Row>
            <Modal
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
        </div>
    }
}

export default Annotation