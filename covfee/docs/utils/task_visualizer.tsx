import * as React from 'react'
import KeyboardManagerContext from '@client/input/keyboard_manager'

interface Props {
    task: TaskSpec
}

interface State {
    error: boolean,
    task: TaskSpec,
    currKey: number
}

export class TaskVisualizer extends React.Component<Props, State> {

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
            setInstructionsFn: () => { },

            // Replayable task props
            ...this.state.task
        })

        return <>
            <KeyboardManagerContext>{task}</KeyboardManagerContext>
            <div>
                <pre
                    className={classNames('docs-task-pg', { 'docs-task-pg-err': this.state.error })}
                    ref={this.taskSpecElem}
                    contentEditable="true"
                    onKeyUp={this.handleChange}>
                </pre >
            </div >
            <Button onClick={this.handleUpdate}>Update</Button>
        </>
    }
}


