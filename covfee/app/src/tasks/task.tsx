import React from 'react'
import {
    Button,
    Alert
} from 'antd';

// This creates the "Task Context" i.e. an object containing a Provider and a Consumer component
// const TaskContext = React.createContext()
import TaskContext from './task_context'

class Task extends React.Component {
    public state = {
        submitting: false,
        error: false
    }

    handleSubmit() {
        // validate the task results
        const result = this.props.validate()
        if(!result) {
            return
        }

        this.setState({ submitting: true })

        // POST request using fetch with error handling
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result)
        }

        fetch(this.props.submit_url, requestOptions)
            .then(async response => {
                const data = await response.json()

                // check for error response
                if (!response.ok) {
                    // get error message from body or default to response status
                    const error = (data && data.message) || response.status
                    return Promise.reject(error)
                }

                this.props.onSubmit()
            })
            .catch(error => {
                this.setState({ error: error.toString(), submitting: false })
                console.error('There was an error!', error)
            })
    }

    render() {
        return <TaskContext.Provider value={{onSubmit: this.handleSubmit.bind(this), submitting: this.state.submitting, error: this.state.error}}>
            <div style={{ overflow: 'hidden' }}>
            {this.props.children}
            </div>
        </TaskContext.Provider>
    }
}

// This is the Submit sub-component, which is a consumer of the Task Context
const Submit = (props) => {
    return <TaskContext.Consumer>
        {(context) => {
            let error = ''
            if (context.error) {
                error = <Alert
                    description={"Error sending to server." + context.error}
                    type="error"
                    showIcon
                />
            }
            return <Button type="primary" onClick={context.onSubmit} loading={context.submitting} {...props}>Next</Button>
            {error}
        }}
    </TaskContext.Consumer>

}
Submit.contextType = TaskContext

Task.Submit = Submit;
export default Task