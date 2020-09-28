import * as React from 'react'
import { withRouter } from 'react-router'
import {
    LoadingOutlined, 
    PropertySafetyFilled, 
    CheckCircleFilled, 
    EyeFilled, 
    EyeInvisibleFilled,
    EditOutlined,
    CheckCircleOutlined,
    BarsOutlined,
    PictureOutlined,
    PlusCircleOutlined
} from '@ant-design/icons';
import {
    Row,
    Col,
    Typography,
    Space,
    Menu,
    Input,
    Button
} from 'antd';
import Collapsible from 'react-collapsible'
const { Text, Title, Link } = Typography;

import ContinuousKeypointTask from './tasks/continuous_keypoint'
import classNames from 'classnames'

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

class TaskGroup extends React.Component {

    render() {
        return <ol className={'task-group'}>
            {this.props.tasks.map(task => 
                <Task key={task.id} 
                    id={task.id} 
                    name={task.name} 
                    active={task.id == this.props.curr_task} 
                    onActivate={this.props.onChangeActiveTask} 
                    onSubmitName={this.props.onSubmitNewTaskName}
                    onInputFocus={this.props.onInputFocus}
                    />)}
            <li><Button type="primary" block="true" onClick={this.props.onAddTask} icon={<PlusCircleOutlined />}>New Task</Button></li>
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

    handleEdit() {
        this.setState({
            editable: true
        }, () => {
            this.inputRef.current.focus()
        })
    }

    handleInputChange(e) {
        this.setState({
            input_text: e.target.value
        })
    }

    handleSubmitName() {
        this.props.onSubmitName(this.props.id, this.state.input_text, ()=>{
            this.setState({
                editable: false
            })
        })
    }

    handleActivate() {
        this.props.onActivate(this.props.id)
    }

    handleFocus() {
        this.props.onInputFocus(true)
    }

    handleBlur() {
        this.props.onInputFocus(false)
    }

    render() {
        this.props.name == ''

        return <li className={classNames('task-li', { 'task-li-active': this.props.active})}>
            <Input 
                onFocus={this.handleFocus.bind(this)} 
                onBlur={this.handleBlur.bind(this)} 
                placeholder="Task Name" 
                onChange={this.handleInputChange.bind(this)} 
                disabled={!this.state.editable} 
                value={this.state.input_text} 
                ref={this.inputRef}/>
            {this.state.editable
                ? <Button icon={<CheckCircleOutlined/>} onClick={this.handleSubmitName.bind(this)}></Button>
                : <Button icon={<EditOutlined />} onClick={this.handleEdit.bind(this)}></Button>}
            <Button icon={<EyeFilled />} onClick={this.handleActivate.bind(this)}></Button>
        </li>
    }
}

class ContinuousAnnotationTool extends React.Component {
    state = {
        status: 'loading',
        curr_task: 0,
        error: false,
        completion_code: false,
        sidebar: {
            taskIds: []
        },
        galleryOpen: false,
        fullscreen: false,
        submittingTask: false
    }
    timeline: object
    id: number
    url: string

    container = React.createRef()
    annotToolRef = React.createRef<ContinuousAnnotationTool>()

    componentDidMount() {
        this.onKeydown = this.onKeydown.bind(this)
        document.addEventListener("keydown", this.onKeydown, false)

        this.id = this.props.match.params.timelineId
        this.url = Constants.api_url + '/timelines/' + this.id

        fetch(this.url)
            .then(res => res.json())
            .then(
                (timeline) => {
                    this.timeline = timeline;
                    console.log(timeline)
                    // get the task IDs
                    const taskIds = Object.keys(timeline.tasks)

                    this.setState({
                        status: 'tasks',
                        curr_task: taskIds[0],
                        sidebar: {
                            'taskIds': taskIds
                        }
                    })
                },
                (error) => {
                    this.setState({
                        status: 'error',
                        error
                    });
                }
            )
    }

    componentWillUnmount() {
        document.removeEventListener("keydown", this.onKeydown, false)
    }

    onKeydown(e: Event) {
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

    handleTaskSubmit(data: object) {
        this.timeline.tasks[data.id] = data
    }

    handleChangeActiveTask(taskId: any) {
        this.setState({
            'curr_task': taskId
        })
    }

    handleSubmitNewTaskName(taskId: string, name: string, cb: Function) {
        if(taskId == 'n') {
            // adding new task
            const url = this.url + '/tasks/add'
            const requestOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'ContinuousKeypointAnnotationTask', name: name })
            }

            fetch(url, requestOptions)
                .then(async response => {
                    const data = await response.json()

                    // check for error response
                    if (!response.ok) {
                        // get error message from body or default to response status
                        const error = (data && data.message) || response.status
                        return Promise.reject(error)
                    }

                    delete this.timeline.tasks['n']
                    this.timeline.tasks[data.id] = data
                    const newTaskIds = Array.from(this.state.sidebar.taskIds)
                    newTaskIds.pop()
                    newTaskIds.push(data.id)
                    this.setState({ sidebar: { taskIds: newTaskIds } }, () => { cb()})
                })
                .catch(error => {
                    // this.setState({ error: error.toString(), submitting: false })
                    console.error('There was an error!', error)
                })
        } else {
            // editing existing task
            const url = this.url + '/tasks/' + taskId + '/edit'
            const requestOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: name })
            }

            fetch(url, requestOptions)
                .then(async response => {
                    const data = await response.json()

                    // check for error response
                    if (!response.ok) {
                        // get error message from body or default to response status
                        const error = (data && data.message) || response.status
                        return Promise.reject(error)
                    }

                    this.timeline.tasks[taskId] = data
                    cb()
                })
                .catch(error => {
                    // this.setState({ error: error.toString(), submitting: false })
                    console.error('There was an error!', error)
                })
        }
    } 

    handleAddTask() {
        if (!this.timeline.tasks.hasOwnProperty('n')) {
            this.timeline.tasks.n = {id: 'n', name: ''}
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

    handleInputFocus(focus: boolean) {
        if(focus) this.annotToolRef.current.stopKeyboardListen()
        else this.annotToolRef.current.startKeyboardListen()
    }

    handleMenuClick(e: object) {
        if (e.key == 'gallery') this.setState({galleryOpen: !this.state.galleryOpen})
    }

    render() {
        switch(this.state.status) {
            case 'loading':
                return <div className={'site-layout-content'}>
                        <LoadingOutlined />
                    </div>

            case 'tasks':
                const tasks = this.state.sidebar.taskIds.map(taskId => this.timeline.tasks[taskId])
                const sidebar = <TaskGroup 
                    tasks={tasks} 
                    curr_task={this.state.curr_task}
                    onAddTask={this.handleAddTask.bind(this)} 
                    onInputFocus={this.handleInputFocus.bind(this)}
                    onChangeActiveTask={this.handleChangeActiveTask.bind(this)}
                    onSubmitNewTaskName={this.handleSubmitNewTaskName.bind(this)} />

                let props = this.timeline.tasks[this.state.curr_task]
                props.url = this.url + '/tasks/' + props.id
                props.media = this.timeline.media
                let task = <ContinuousKeypointTask 
                    taskName={this.timeline.tasks[this.state.curr_task].name}
                    key={this.state.curr_task} 
                    submitting={this.state.submittingTask}
                    onSubmit={this.handleTaskSubmit.bind(this)} 
                    ref={this.annotToolRef}
                    {...props}/>

                return <div className="tool-container" ref={this.container}>
                    <Row>
                        <Col span={24}>
                            <Menu onClick={this.handleMenuClick.bind(this)} mode="horizontal" theme="dark">
                                <Menu.Item key="instructions" icon={<BarsOutlined />}>
                                    Instructions
                                </Menu.Item>
                                <Menu.Item key="gallery" icon={<PictureOutlined />}>
                                    Gallery
                                </Menu.Item>
                            </Menu>
                            <Collapsible open={this.state.galleryOpen}>
                                <img src={this.timeline.media.gallery_url} className={"gallery-img"} />
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
                </div>
            default:
                return

        }
    }
}

const ContinuousAnnotationWithRouter = withRouter(ContinuousAnnotationTool);

export { ContinuousAnnotationWithRouter }