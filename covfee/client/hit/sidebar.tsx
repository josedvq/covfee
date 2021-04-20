import * as React from 'react'
import {
    Button, Input, 
} from 'antd'
import { CaretDownOutlined, EditOutlined, EyeFilled, PlusCircleOutlined } from '@ant-design/icons'
import classNames from 'classnames'

import { TaskEditorModal } from './task_editor'

import { EditableTaskFields, PresetsSpec, TaskSpec, ChildTaskSpec, TaskType, UserTaskSpec} from '@covfee-types/task'

interface Props {
    /**
     * Id of the task that is currently active
     */
    currTask: [number, number],
    /**
     * List of tasks to display in the list
     */
    tasks: Array<TaskType>
    /**
     * Called when the user changes the active task
     */
    onChangeActiveTask: (arg0: [number, number]) => void
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
        onTaskEdit: (arg0: [number, number], arg1: EditableTaskFields) => Promise<void>
        /**
         * Called when a new task is created via the sidebar
         */
        onTaskCreate: (arg0: number, arg1: EditableTaskFields) => Promise<void>
        /**
         * Called when a task is deleted
         */
        onTaskDelete: (arg0: [number, number]) => Promise<void>
        /**
         * Spec of the types of tasks that can be created
         */
        presets: PresetsSpec
    }
}
interface State {
    editTaskModal: {
        taskId: [number, number]
        visible: boolean
        new: boolean
    }
}

export class Sidebar extends React.Component<Props, State> {

    state: State = {
        editTaskModal: {
            taskId: [0,0],
            visible: false,
            new: false
        }
    }

    handleClickEdit = (taskId: [number, number]) => {
        if (!this.props.editMode.enabled) return
        this.setState({
            editTaskModal: {
                ...this.state.editTaskModal,
                taskId: taskId,
                visible: true,
                new: false
            }
        })
    }

    handleClickAdd = (parentId: number) => {
        if (!this.props.editMode.enabled) return
        this.setState({
            editTaskModal: {
                ...this.state.editTaskModal,
                taskId: [parentId, null],
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
        return <nav className="sidebar">
            {/* {this.props.editMode.enabled &&
                <TaskEditorModal
                    visible={this.state.editTaskModal.visible}
                    new={this.state.editTaskModal.new}
                    presets={this.props.editMode.presets}
                    task={this.props.tasks[this.state.editTaskModal.taskId]}
                    onSubmit={(task)=>{
                        return this.state.editTaskModal.new ?
                            this.props.editMode.onTaskCreate(task) :
                            this.props.editMode.onTaskEdit(this.state.editTaskModal.taskId, task)
                    }}
                    onClose={this.handleEditTaskCancel}
                    onDelete={() => { return this.props.editMode.onTaskDelete(this.state.editTaskModal.taskIndex)}} />
            } */}
            <ol className={'task-group'}>
                {this.props.tasks.map((task, index) => 
                    <TaskSection
                        key={task.id} 
                        name={task.name} 
                        children={task.children.map((child, idx) =>{
                            return {
                                name: child.name,
                                active: (idx === this.props.currTask[1]),
                                editable: true // TODO: fix
                            }
                        })}
                        editable={task.editable}
                        active={index == this.props.currTask[0] && this.props.currTask[1] == null}
                        onClickActivate={(child_index) => { this.props.onChangeActiveTask([index, child_index])}}
                        onClickEdit={(child_index) => { this.handleClickEdit([index, child_index])}}/>)}
                
            </ol>
            <Button
                type="primary"
                disabled={!this.props.editMode.enabled || !this.props.editMode.allowNew}
                block={true}
                onClick={() => { this.handleClickAdd(null) }}
                icon={<PlusCircleOutlined />}>
                New Task
                </Button>
        </nav>
    }
}

interface TaskButtonSpec {
    // index: number,
    name: string,
    active: boolean,
    editable: boolean,
}
interface TaskSectionProps extends TaskButtonSpec {
    children: Array<TaskButtonSpec>
    onClickEdit: (arg0: number) => void
    onClickActivate: (arg0: number) => void
}
export class TaskSection extends React.Component<TaskSectionProps> {

    toggleExpand = () => {}

    render() {
        return <li className={classNames('task-li')}>
            <TaskButton name={this.props.name}
                className={{"sidebar-btn-parent": true}}
                active={this.props.active}
                editable={false}
                expandable={true}
                onClickActivate={()=>{this.props.onClickActivate(null)}}
                onClickExpand={this.toggleExpand}/>
            
            {this.props.editable &&
            <div onClick={()=>{this.props.onClickEdit(null)}}>
                edit task <EditOutlined />
            </div>}
            <ol className="sidebar-children">
                {this.props.children.map((child, index)=>{
                    return <li key={index}>
                        <TaskButton
                            name={child.name}
                            className={{ "sidebar-btn-child": true }}
                            active={child.active}
                            editable={false}
                            expandable={true}
                            onClickActivate={()=>{this.props.onClickActivate(index)}}
                            onClickExpand={this.toggleExpand} />
                    </li>
                })}
            </ol>
        </li>
    }
}


interface TaskButtonProps extends TaskButtonSpec {
    onClickActivate: () => void
    expandable?: boolean
    onClickExpand?: () => void
    onClickEdit?: () => void
    className?: object
}
export class TaskButton extends React.Component<TaskButtonProps> {
    static defaultProps = {
        expandable: false
    }
    render() {
        return <div className={classNames({
                    'sidebar-btn': true, 
                    'sidebar-btn-active': this.props.active,
                    ...this.props.className})} onClick={this.props.onClickActivate}>

            <div className="sidebar-btn-icon">
                {this.props.editable &&
                    <EditOutlined />}
                {this.props.expandable &&
                    <CaretDownOutlined />}
            </div>
            <div className="sidebar-btn-name">
                {this.props.name}
            </div>
            
        </div>
    }
}