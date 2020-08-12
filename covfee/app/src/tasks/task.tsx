import React from 'react'
import {
    Button
} from 'antd';

// This creates the "Task Context" i.e. an object containing a Provider and a Consumer component
const TaskContext = React.createContext()

class Task extends React.Component {
    public instructions = this.props.instructions
    public submit_url = this.props.submit_url

    constructor(props: any) {
        super(props)
    }

    render() {
        return <TaskContext.Provider value={{handleSubmit: this.props.handleSubmit}}>
            <div style={{ overflow: 'hidden' }}>
            {this.props.children}
            </div>
        </TaskContext.Provider>
    }
}

// This is the Submit sub-component, which is a consumer of the Task Context
class Submit extends React.Component {
    static contextType = TaskContext;

    render() {
        return <TaskContext.Consumer>
            <Button type="primary" onClick={this.context.handleSubmit}>{this.props.children}</Button>
        </TaskContext.Consumer>
    }
}

Task.Submit = Submit;
export default Task