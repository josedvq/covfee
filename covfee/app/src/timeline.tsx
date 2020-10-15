import * as React from 'react';
import {
    Typography,
} from 'antd';
import 'antd/dist/antd.css'
const { Text, Title, Link } = Typography;


const Constants = require('./constants.json')
import {myerror, throwBadResponse } from './utils'
import { getTaskClass} from './task_utils'
import { TaskSpec} from 'Tasks/task'

interface TimelineState{
    currTask: number,
    error: string
}
interface TimelineProps {
    tasks: { [key: string]: TaskSpec },
    onSubmit: Function
}
class Timeline extends React.Component<TimelineProps, TimelineState> {
    state: TimelineState = {
        currTask: 0,
        error: null
    }
    tasks: Array<TaskSpec>
    id: number
    url: string

    componentDidMount() {
        // convert tasks dict to array
        var tasks = Object.keys(this.props.tasks).map(function (key) {
            return this.props.tasks[key]
        })
        this.tasks = tasks
        let new_idx = 0
        this.tasks.forEach((el, idx) => {
            if (el.numSubmissions > 0) {
                new_idx = idx + 1
            }
        })
        this.setState({currTask: new_idx})
    }

    handleTaskSubmit = (taskResult: any) => {
        const url = this.url + '/tasks/' + this.tasks[this.state.currTask].id + '/submit'
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskResult)
        }

        let p = fetch(url, requestOptions)
            .then(throwBadResponse)

        p.then(()=>{
            // if done with tasks
            if (this.state.currTask == this.tasks.length - 1) {
                this.props.onSubmit()
            } else {
                // go to next task
                this.setState({
                    currTask: this.state.currTask + 1
                })
            }
        }).catch(error=>{
            myerror('Error submitting the task.', error)
        })    
    }

    render() {   
        const props = this.tasks[this.state.currTask]
        props.url = this.url + '/tasks/' + props.id

        const taskClass = getTaskClass(props.type)
        return React.createElement(taskClass, {
            key: this.state.currTask,
            onSubmit: this.handleTaskSubmit,
            ...props }, null)
    }
}

export default Timeline