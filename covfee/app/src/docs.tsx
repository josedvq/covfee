import * as React from 'react'
import {TaskSpec} from './tasks/task'
import AvailableTasks from './tasks'
import classNames from 'classnames'
import './css/docs.css'
import { Button } from 'antd'
import $ from 'jquery'

const getTaskClass = (type: string) => {
    if (type in AvailableTasks) {
        const taskClass = AvailableTasks[type]
        return taskClass
    } else {
        return null
    }
}

// removes relative links in Markdown
// used to clean github docs for storybook
const updateMarkdownLinks = (doc: string) => {
    const html = $($.parseHTML('<div>'+doc+'</div>'))
    html.find('a')
    .filter(function(){
        const pattern = /^((http|https|ftp):\/\/)/
        const href = $(this).attr("href")
        return !pattern.test(href)
    })
    .each(function() {
        $(this).attr('href', null)
        $(this).css({
            'pointer-events': 'none',
            cursor: 'default',
            'text-decoration': 'none',
            'color': 'black'
        })
    })
    return html.html()
}

interface Props {
    task: TaskSpec
}

interface State {
    error: boolean,
    task: TaskSpec,
    currKey: number
}

class TaskVisualizer extends React.Component<Props, State> {

    state: State = {
        error: false,
        task: null,
        currKey: 0
    }

    originalTask: TaskSpec = null
    taskSpecElem = React.createRef<HTMLPreElement>()

    constructor(props: Props) {
         super(props)
         this.state = {
             ...this.state,
             task: this.props.task,
         }
        this.originalTask = this.props.task
    }

    componentDidMount() {
        this.taskSpecElem.current.textContent = JSON.stringify(this.props.task, null, 2)
    }

    handleData = data => {

    }

    handleEnd = data => {

    }

    handleUpdate = () => {
        try {
            const json = JSON.parse(this.taskSpecElem.current.textContent)
            this.setState({
                error: false,
                task: json,
                currKey: this.state.currKey + 1
            })
        } catch (err) {
            this.setState({
                error: true,
            })
        }
    }

    handleChange = () => {
        try {
            const json = JSON.parse(this.taskSpecElem.current.textContent)
            this.setState({
                error: false,
                task: json
            })
        } catch (err) {
            this.setState({
                error: true,
            })
        }
    }

    render() {
        const taskClass = getTaskClass(this.props.task.type)

        const task = React.createElement(taskClass, {
            // Annotation task props
            buffer: this.handleData,
            onEnd: this.handleEnd,

            // Replayable task props
            ...this.state.task})

        return <>
            {task}
            <div>
                <pre 
                    className={classNames('docs-task-pg',{'docs-task-pg-err': this.state.error})}
                    ref={this.taskSpecElem}
                    contentEditable="true"
                    onKeyUp={this.handleChange}>
                </pre >
            </div >
            <Button onClick={this.handleUpdate}>Update</Button>
        </>
    }
}

export { 
    TaskVisualizer,
    updateMarkdownLinks}