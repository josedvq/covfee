import * as React from 'react'
import {
    Button, Input, 
} from 'antd'
import { EditOutlined, EyeFilled, PlusCircleOutlined } from '@ant-design/icons'
import classNames from 'classnames'


export class TaskGroup extends React.Component<any, {}> {
    render() {
        return <ol className={'task-group'}>
            {this.props.tasks.map((task, index) => 
                <Task key={task.id} 
                    id={index} 
                    name={task.name} 
                    editable={task.editable}
                    active={index == this.props.currTask} 
                    onActivate={this.props.onChangeActiveTask} 
                    onClickEdit={this.props.onClickEdit}/>)}
            <li>
                <Button 
                    type="primary" 
                    disabled={!this.props.allowNewTasks}
                    block={true} 
                    onClick={this.props.onClickAdd} 
                    icon={<PlusCircleOutlined />}>
                        New Task
                </Button>
            </li>
        </ol>
    }
}

export class Task extends React.Component {

    handleEdit = () => {
        this.props.onClickEdit(this.props.id)
    }
    
    handleActivate = () => {
        this.props.onActivate(this.props.id)
    }

    render() {
        let editButton = <></>
        if (this.props.editable)
            editButton = <Button icon={<EditOutlined />} onClick={this.handleEdit}></Button>
            
        return <li className={classNames('task-li', { 'task-li-active': this.props.active})}>
            <Input 
                disabled={true} 
                value={this.props.name} />
            {editButton}
            <Button icon={<EyeFilled />} onClick={this.handleActivate}></Button>
        </li>
    }
}