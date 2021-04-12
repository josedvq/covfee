import * as React from 'react'
import {
    Button, Input, 
} from 'antd'
import { EditOutlined, EyeFilled, PlusCircleOutlined } from '@ant-design/icons'
import classNames from 'classnames'

import { TaskEditorModal } from './task_editor'

import { EditableTaskFields, PresetsSpec, TaskSpec, TaskType, UserTaskSpec} from '@covfee-types/task'

interface Props {
    /**
     * Id of the task that is currently active
     */
    currTask: number,
    /**
     * List of tasks to display in the list
     */
    tasks: Array<TaskType>
    /**
     * Called when the user changes the active task
     * Should return a promise resolving to true if the task is successfully changed and false otherwise
     */
    onChangeActiveTask: (arg0: number) => void
    /**
     * Settings for the mode where the sidebar can be used to edit tasks
     */
    editMode?: {
        /**
         * Enable editing for editable tasks
         */
        enabled:boolean
        /**
         * Allow the creation of new tasks (shows the "new task" button)
         */
        allowNew:boolean
        /**
         * Called when a task is edited via the sidebar
         */
        onTaskEdit: (arg0: number, arg1: EditableTaskFields) => Promise<void>
        /**
         * Called when a new task is created via the sidebar
         */
        onTaskCreate: (arg0: EditableTaskFields) => Promise<void>
        /**
         * Called when a task is deleted
         */
        onTaskDelete: (ar01: number) => Promise<void>
        /**
         * Spec of the types of tasks that can be created
         */
        presets: PresetsSpec
    }
}
interface State {
    editTaskModal: {
        taskIndex: number
        visible: boolean
        new: boolean
    }
}

export class Sidebar extends React.Component<Props, State> {

    state: State = {
        editTaskModal: {
            taskIndex: 0,
            visible: false,
            new: false
        }
    }

    handleClickEdit = (taskIndex: number) => {
        if (!this.props.editMode.enabled) return
        this.setState({
            editTaskModal: {
                ...this.state.editTaskModal,
                taskIndex: taskIndex,
                visible: true,
                new: false
            }
        })
    }

    handleClickAdd = () => {
        if (!this.props.editMode.enabled) return
        this.setState({
            editTaskModal: {
                ...this.state.editTaskModal,
                taskIndex: null,
                visible: true,
                new: true
            }
        })
    }

    handleEditTaskCancel = () => {
        this.setState({
            editTaskModal: {
                ...this.state.editTaskModal,
                visible: false,
            }
        })
    }

    render() {
        return <>
            {this.props.editMode.enabled &&
                <TaskEditorModal
                    visible={this.state.editTaskModal.visible}
                    new={this.state.editTaskModal.new}
                    presets={this.props.editMode.presets}
                    task={this.props.tasks[this.state.editTaskModal.taskIndex]}
                    onSubmit={(task)=>{
                        return this.state.editTaskModal.new ?
                            this.props.editMode.onTaskCreate(task) :
                            this.props.editMode.onTaskEdit(this.state.editTaskModal.taskIndex, task)
                    }}
                    onClose={this.handleEditTaskCancel}
                    onDelete={() => { return this.props.editMode.onTaskDelete(this.state.editTaskModal.taskIndex)}} />
            }
            <ol className={'task-group'}>
                {this.props.tasks.map((task, index) => 
                    <Task key={task.id} 
                        index={index} 
                        name={task.name} 
                        editable={task.editable}
                        active={index == this.props.currTask} 
                        onClickActivate={()=>{this.props.onChangeActiveTask(index)}}
                        onClickEdit={() => { this.handleClickEdit(index)}}/>)}
                <li>
                    <Button 
                        type="primary" 
                        disabled={!this.props.editMode.enabled}
                        block={true} 
                        onClick={this.handleClickAdd}
                        icon={<PlusCircleOutlined />}>
                            New Task
                    </Button>
                </li>
            </ol>
        </>
    }
}

interface TaskButtonProps {
    index: number,
    name: string,
    active: boolean,
    editable: boolean,
    onClickEdit: () => void
    onClickActivate: () => void
}
export class Task extends React.Component<TaskButtonProps> {
    render() {
        let editButton = <></>
        if (this.props.editable)
            editButton = <Button icon={<EditOutlined />} onClick={this.props.onClickEdit}></Button>
            
        return <li className={classNames('task-li', { 'task-li-active': this.props.active})}>
            <Input 
                disabled={true} 
                value={this.props.name} />
            {editButton}
            <Button icon={<EyeFilled />} onClick={this.props.onClickActivate}></Button>
        </li>
    }
}