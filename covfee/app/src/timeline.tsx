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

interface State {
    currTask: number,
    error: string
}
interface Props {
    tasks: { [key: string]: TaskSpec },
    url: string,
    onSubmit: Function
}
class Timeline extends React.Component<Props, State> {
    state: State = {
        currTask: 0,
        error: null
    }
    tasks: Array<TaskSpec>

    constructor(props: Props) {
        super(props)
        // convert tasks dict to array
        var tasks = Object.keys(props.tasks).map(function (key) {
            return props.tasks[key]
        })
        this.tasks = tasks

        let new_idx = 0
        this.tasks.forEach((el, idx) => {
            if (el.numSubmissions > 0) {
                new_idx = idx + 1
            }
        })
        this.state = {
            ...this.state,
            currTask: new_idx 
        }
    }

    handleTaskSubmit = (taskResult: any) => {
        const url = this.props.url + '/tasks/' + this.tasks[this.state.currTask].id + '/submit'
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