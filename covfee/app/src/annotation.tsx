import * as React from 'react'
import {
    EyeFilled, 
    EditOutlined,
    CheckCircleOutlined,
    BarsOutlined,
    PictureOutlined,
    PlusCircleOutlined, LoadingOutlined
} from '@ant-design/icons'
import {
    Row,
    Col,
    Typography,
    Menu,
    Input,
    Button, 
    Modal
} from 'antd';
import Collapsible from 'react-collapsible'
const { Text, Title, Link } = Typography

import ContinuousKeypointTask from './tasks/continuous_keypoint'
import classNames from 'classnames'
const Constants = require('./constants.json')
import {myerror, fetcher, throwBadResponse} from './utils'
import { TaskSpec } from 'Tasks/task'
import { Buffer, EventBuffer, DummyBuffer } from './buffer';

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
                    onSubmitName={this.props.onSubmitNewTaskName}
                    onInputFocus={this.props.onInputFocus}
                    />)}
            <li><Button type="primary" block={true} onClick={this.props.onAddTask} icon={<PlusCircleOutlined />}>New Task</Button></li>
        </ol>
    }
}

class Task extends React.Component {
    state = {
        editable: false,
        loading: false,
        input_text: ''
    }

    inputRef = React.createRef<Input>()

    componentDidMount() {
        this.setState({
            input_text: this.props.name
        }, ()=>{
            if(this.props.name == '') {
                this.handleEdit()
            }
        })
    }

    handleEdit = () => {
        this.setState({
            editable: true
        }, () => {
            this.inputRef.current.focus()
        })
    }

    handleInputChange = (e) => {
        this.setState({
            input_text: e.target.value
        })
    }

    handleSubmitName = () => {
        this.setState({
            editable: false
        })
        this.props.onSubmitName(this.props.id, this.state.input_text, ()=>{})
    }

    handleActivate = () => {
        this.props.onActivate(this.props.id)
    }

    handleFocus = () => {
        this.props.onInputFocus(true)
    }

    handleBlur = () => {
        this.props.onInputFocus(false)
    }

    render() {
        this.props.name == ''

        return <li className={classNames('task-li', { 'task-li-active': this.props.active})}>
            <Input 
                onFocus={this.handleFocus} 
                onBlur={this.handleBlur} 
                placeholder="Task Name" 
                onChange={this.handleInputChange} 
                disabled={!this.state.editable} 
                value={this.state.input_text} 
                ref={this.inputRef}/>
            {this.state.editable
                ? <Button icon={<CheckCircleOutlined/>} onClick={this.handleSubmitName}></Button>
                : <Button icon={<EditOutlined />} onClick={this.handleEdit}></Button>}
            <Button icon={<EyeFilled />} onClick={this.handleActivate}></Button>
        </li>
    }
}

interface AnnotationProps {
    type: string,
    id: string,
    media: object,
    project: object,
    submitted: boolean,
    tasks: { [key: string]: TaskSpec }
}

interface AnnotationState {
    currTask: string,
    loadingTask: boolean,
    error: string,
    completionCode: string,
    sidebar: {
        taskIds: Array<string>
    },
    galleryOpen: boolean,
    fullscreen: boolean,
    submittingTask: boolean,
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
        galleryOpen: false,
        fullscreen: false,
        submittingTask: false,
        errorModal: {
            visible: false,
            message: '',
            loading: false
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
    taskRef = React.createRef<ContinuousKeypointTask>()

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
            this.handleTaskReplay()
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
                        visible: (this.tasks[taskId].response != null),
                        submitted: (this.tasks[taskId].response != null)
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
    handleTaskReplay = () => {
        this.startNewBuffer(this.state.currTask, true)
        this.setState({
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

    handleTaskRedo = () => {
        this.startNewBuffer(this.state.currTask)
        this.setState({
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

    handleSubmitNewTaskName = (taskId: string, name: string, cb: Function) => {
        if(taskId == 'n') {
            // adding new task
            const url = this.url + '/tasks/add'
            const requestOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'ContinuousKeypointTask', name: name })
            }

            fetch(url, requestOptions)
                .then(throwBadResponse)
                .then(data => {
                    delete this.tasks['n']
                    this.tasks[data.id] = data
                    const newTaskIds = Array.from(this.state.sidebar.taskIds)
                    newTaskIds.pop()
                    newTaskIds.push(data.id)
                    this.setState({
                        currTask: this.state.currTask == 'n' ? data.id : this.state.currTask,
                        sidebar: { taskIds: newTaskIds } 
                    }, () => { cb()})
                })
                .catch(error => {
                    // this.setState({ error: error.toString(), submitting: false })
                    myerror('Error creating the new task.', error)
                })
        } else {
            // editing existing task
            const url = Constants.api_url + '/tasks/' + taskId + '/edit'
            const requestOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name })
            }

            fetch(url, requestOptions)
                .then(throwBadResponse)
                .then(data => {
                    this.tasks[taskId] = data
                    cb()
                })
                .catch(error => {
                    // this.setState({ error: error.toString(), submitting: false })
                    myerror('Error creating the new task.', error)
                })
        }
    } 

    handleAddTask = () => {
        if (!this.tasks.hasOwnProperty('n')) {
            this.tasks.n = {id: 'n', name: ''}
            const newTaskIds = Array.from(this.state.sidebar.taskIds)
            newTaskIds.push('n')
            this.setState({
                sidebar: {
                    taskIds: newTaskIds
                }
            })
        } else {
            myerror('Please finish creating the existing tasks.')
        }
    }

    handleInputFocus = (focus: boolean) => {
        if(focus) this.taskRef.current.stopKeyboardListen()
        else this.taskRef.current.startKeyboardListen()
    }

    handleMenuClick = (e: object) => {
        if (e.key == 'gallery') this.setState({galleryOpen: !this.state.galleryOpen})
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
        const sidebar = <TaskGroup 
            tasks={tasks} 
            currTask={this.state.currTask}
            onAddTask={this.handleAddTask} 
            onInputFocus={this.handleInputFocus}
            onChangeActiveTask={this.handleChangeActiveTask}
            onSubmitNewTaskName={this.handleSubmitNewTaskName} />

        let task = null
        let overlay = null
        if (this.state.loadingTask) {
            overlay = <></>
            task = <LoadingOutlined/>
        } else {
            let props = this.tasks[this.state.currTask]
            props.url = this.url + '/tasks/' + props.id
            props.media = this.props.media

            overlay = <div className={classNames('task-container')}>
                <div className={classNames('task-overlay', { 'task-overlay-off': !this.state.overlay.visible })}>
                    <div className="task-overlay-nav">
                        <Button onClick={this.handleTaskReplay}>Replay</Button>
                        <Button onClick={this.handleTaskRedo}>Re-do</Button>
                        <Button onClick={this.handleTaskSubmit} 
                            type="primary" 
                            disabled={this.state.overlay.submitted || this.state.replay.enabled} 
                            loading={this.state.overlay.submitting}
                            >Submit</Button>
                    </div>
                </div>
            </div>

            task = <ContinuousKeypointTask 
                    taskName={this.tasks[this.state.currTask].name}
                    replayMode={this.state.replay.enabled}
                    getNextReplayAction={this.getNextReplayAction}
                    getCurrReplayAction={this.getCurrReplayAction}
                    buffer={this.buffer.data}
                    key={this.state.currKey} 
                    onEnd={this.handleTaskEnd} 
                    ref={this.taskRef}
                    {...props}/>
            
            
        }

        return <div className="tool-container" ref={this.container}>
            <Row>
                <Col span={24}>
                    <Menu onClick={this.handleMenuClick} mode="horizontal" theme="dark">
                        <Menu.Item key="instructions" icon={<BarsOutlined />}>
                            Instructions
                        </Menu.Item>
                        <Menu.Item key="gallery" icon={<PictureOutlined />}>
                            Gallery
                        </Menu.Item>
                    </Menu>
                    <Collapsible open={this.state.galleryOpen}>
                        <img src={this.props.media.gallery_url} className={"gallery-img"} />
                    </Collapsible>
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