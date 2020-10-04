import * as React from 'react'
import {
    EyeFilled, 
    EditOutlined,
    CheckCircleOutlined,
    BarsOutlined,
    PictureOutlined,
    PlusCircleOutlined
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
import {throwBadResponse} from './utils'
import { TaskSpec } from 'Tasks/task'
import { EventBuffer } from './buffer';

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
    }
}
class Annotation extends React.Component<AnnotationProps, AnnotationState> {
    state:AnnotationState = {
        currTask: '0',
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
        }
    }
    url: string
    tasks: { [key: string]: TaskSpec}
    buffer: EventBuffer
    container = React.createRef<HTMLDivElement>()
    annotToolRef = React.createRef<ContinuousKeypointTask>()

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
        this.startNewBuffer()        
    }

    componentDidMount() {
        document.addEventListener("keydown", this.handleKeydown, false)
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

    handleTaskSubmit = (taskResult: any) => {
        // first send all the chunks in the buffer
        this.buffer.attemptBufferSubmit(true)

        // then submit the task
        return this.buffer.awaitQueueClear(3000).then(() => {
            const url = this.url + '/tasks/' + this.tasks[this.state.currTask].id + '/submit'
            const requestOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskResult)
            }

            return fetch(url, requestOptions)
                .then(throwBadResponse)
                .then((data)=>{
                    this.tasks[data.id] = data
                }).catch(error=>{
                    console.error('There was an error submitting the task!', error)
                })
        })
    }

    handleChangeActiveTask = (taskId: string) => {
        this.setState({
            currTask: taskId
        }, this.startNewBuffer)
    }

    startNewBuffer = () => {
        const taskId = this.tasks[this.state.currTask].id
        this.buffer = new EventBuffer(
            2000,
            this.url + '/tasks/' + taskId + '/chunk',
            this.handleBufferError)
    }

    handleSubmitNewTaskName = (taskId: string, name: string, cb: Function) => {
        if(taskId == 'n') {
            // adding new task
            const url = this.url + '/tasks/add'
            const requestOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'ContinuousKeypointAnnotationTask', name: name })
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
                    console.error('There was an error!', error)
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
                    console.error('There was an error!', error)
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
            console.log('must finish creating firts.')
        }
    }

    handleInputFocus = (focus: boolean) => {
        if(focus) this.annotToolRef.current.stopKeyboardListen()
        else this.annotToolRef.current.startKeyboardListen()
    }

    handleMenuClick = (e: object) => {
        if (e.key == 'gallery') this.setState({galleryOpen: !this.state.galleryOpen})
    }

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

    render() {
        const tasks = this.state.sidebar.taskIds.map(taskId => this.tasks[taskId])
        const sidebar = <TaskGroup 
            tasks={tasks} 
            currTask={this.state.currTask}
            onAddTask={this.handleAddTask} 
            onInputFocus={this.handleInputFocus}
            onChangeActiveTask={this.handleChangeActiveTask}
            onSubmitNewTaskName={this.handleSubmitNewTaskName} />

        let props = this.tasks[this.state.currTask]
        props.url = this.url + '/tasks/' + props.id
        props.media = this.props.media
        let task = <ContinuousKeypointTask 
            taskName={this.tasks[this.state.currTask].name}
            buffer={this.buffer.data}
            key={this.state.currTask} 
            onSubmit={this.handleTaskSubmit} 
            ref={this.annotToolRef}
            {...props}/>

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