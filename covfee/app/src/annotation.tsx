import React from 'react';
import { withRouter } from 'react-router'
import {
    LoadingOutlined, 
    PropertySafetyFilled, 
    CheckCircleFilled, 
    EyeFilled, 
    EyeInvisibleFilled,
    EditOutlined,
    CheckCircleOutlined
} from '@ant-design/icons';
import {
    Row,
    Col,
    Typography,
    Space,
    Input,
    Button
} from 'antd';
import {DragDropContext} from 'react-beautiful-dnd'
const { Text, Title, Link } = Typography;

import ContinuousKeypointAnnotationTool from './continuous/tool'
import Constants from './constants'
import classNames from 'classnames'

class TaskGroup extends React.Component {

    render() {
        return <ol className={'task-group'}>
            {this.props.tasks.map(task => 
                <Task key={task.id} 
                    id={task.id} 
                    name={task.name} 
                    active={task.active} 
                    onActivate={this.props.onChangeActiveTask} />
                    )}
            <li><Button type="primary" onClick={this.props.onAddTask}>New Task</Button></li>
        </ol>
    }
}

class Task extends React.Component {
    state = {
        editable: false,
        loading: false,
        name: ''
    }

    handleEdit() {
        this.setState({
            editable: true
        })
    }

    handleSubmitName() {

    }

    handleActivate() {
        this.props.onActivate(this.props.id)
    }

    render() {
        this.props.name == ''

        return <li className={classNames('task-li', { 'task-li-active': this.props.active})}>
            <Input placeholder="Task Name" disabled={!this.state.editable} value={this.props.name}></Input>
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
        }
    }
    timeline: object
    id: number
    url: string

    componentDidMount() {
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

    handleTaskSubmit() {
        
    }

    handleChangeActiveTask(taskId: any) {
        this.timeline.tasks[this.state.curr_task].active = false
        this.setState({
            'curr_task': taskId
        })
        this.timeline.tasks[taskId].active = true
    }

    handleAddTask() {
        if(!this.timeline.tasks.hasAttribute('n')) {
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

    render() {
        switch(this.state.status) {
            case 'loading':
                return <div className={'site-layout-content'}>
                        <LoadingOutlined />
                    </div>

            case 'tasks':
                const tasks = this.state.sidebar.taskIds.map(taskId => this.timeline.tasks[taskId])
                const sidebar = <TaskGroup tasks={tasks} onAddTask={this.handleAddTask.bind(this)} onChangeActiveTask={this.handleChangeActiveTask.bind(this)} />

                let props = this.timeline.tasks[this.state.curr_task]
                props.media = this.timeline.media
                let task = <ContinuousKeypointAnnotationTool key={this.state.curr_task} onSubmit={this.handleTaskSubmit.bind(this)} {...props}/>

                return <Row gutter={16}>
                    <Col span={16}>
                        {task}
                    </Col>
                    <Col span={8}>
                        {sidebar}
                    </Col>
                </Row>

            case 'sending':
                return <div className={'site-layout-content'}>
                        <LoadingOutlined />
                    </div>

            default:
                return

        }
    }
}

const ContinuousAnnotationWithRouter = withRouter(ContinuousAnnotationTool);

export { ContinuousAnnotationWithRouter }