import * as React from 'react'
import styled from 'styled-components'
import {
    Button, Input, 
} from 'antd'
import { CaretDownOutlined, EditOutlined, EyeFilled, PlusCircleOutlined } from '@ant-design/icons'
import classNames from 'classnames'

import { TaskSpec, TaskType} from '@covfee-shared/spec/task'

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
    onChangeActiveTask: (arg0: number) => void
}
interface State {
}

export class Sidebar extends React.Component<Props, State> {

    state: State = {
    }

    taskElementRefs: TaskSection[] = []

    constructor(props: Props) {
        super(props)
    }

    componentDidUpdate(prevProps: Props) {
        const curr = this.props.currTask
        if(prevProps.currTask != curr) {
            if(this.taskElementRefs[curr[0]]) {
               this.taskElementRefs[curr[0]].scrollIntoView()
            }
        }
    }

   

    render() {
        this.taskElementRefs = []
        return <SidebarContainer>
            <SidebarHead>
                {this.props.children}
            </SidebarHead>

            {(this.props.editMode.enabled && this.props.editMode.allowNew) &&
            <Button
                type="primary"
                className="sidebar-new"
                block={true}
                onClick={() => { this.handleClickAdd(null) }}
                icon={<PlusCircleOutlined />}>
                New Task
                </Button>}
            
            <SidebarScrollable>
                <ol className={'task-group'}>
                    {this.props.tasks.map((task, index) => 
                        <TaskSection
                            key={task.id}
                            ref={el=>{this.taskElementRefs[index] = el}}
                            name={task.spec.name} 
                            children={task.children ? task.children.map((child, idx) =>{
                                return {
                                    name: child.spec.name,
                                    status: (index === this.props.currTask[0] && idx === this.props.currTask[1]) ? 'active' :
                                        child.num_submissions == 0 ? 'default' :
                                        child.valid ? 'valid' : 'invalid',
                                    editable: true // TODO: fix
                                }
                            }) : []}
                            status={(index == this.props.currTask[0] && this.props.currTask[1] == null) ? 'active' : 
                                task.num_submissions == 0 ? 'default' : 
                                task.valid ? 'valid' : 'invalid'}
                            editable={task.editable}
                            onClickActivate={(child_index) => { this.props.onChangeActiveTask([index, child_index])}}
                            onClickEdit={(child_index) => { this.handleClickEdit([index, child_index])}}/>)}
                    
                </ol>
            </SidebarScrollable>
            
        </SidebarContainer>
    }
}

interface TaskButtonSpec {
    // index: number,
    name: string,
    active: boolean,
    editable: boolean,
    status: 'default' | 'active' | 'valid' | 'invalid' 
}
interface TaskSectionProps extends TaskButtonSpec {
    children: Array<TaskButtonSpec>
    onClickEdit: (arg0: number) => void
    onClickActivate: (arg0: number) => void
}
export class TaskSection extends React.Component<TaskSectionProps> {

    liRef = React.createRef<HTMLLIElement>()

    toggleExpand = () => {}

    scrollIntoView = () => {
        if(this.liRef.current)
            this.liRef.current.scrollIntoView({behavior: 'smooth', block: 'center'})
    }

    render() {
        return <li className={classNames('task-li')} ref={this.liRef}>
            <TaskButton name={this.props.name}
                className={{"btn-parent": true}}
                status={this.props.status}
                active={this.props.active}
                editable={false}
                expandable={this.props.children && this.props.children.length > 0}
                onClickActivate={()=>{this.props.onClickActivate(null)}}
                onClickExpand={this.toggleExpand}/>
            
            {this.props.editable &&
            <div className={classNames(['sidebar-group-editbtn', 'background'])} onClick={()=>{this.props.onClickEdit(null)}}>
                <span>edit task</span>
            </div>}
            <ol className="sidebar-children">
                {this.props.children.map((child, index)=>{
                    return <li key={index}>
                        <TaskButton
                            name={child.name}
                            className={{ "btn-child": true }}
                            status={this.props.status}
                            active={child.active}
                            editable={false}
                            expandable={false}
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
        return <div className={classNames('btn', `btn-${this.props.status}`, {
                    ...this.props.className})} onClick={this.props.onClickActivate}>

            <div className="btn-icon">
                {this.props.editable &&
                    <EditOutlined />}
                {this.props.expandable &&
                    <CaretDownOutlined />}
            </div>
            <div className="btn-name">
                {this.props.name}
            </div>
            
        </div>
    }
}

/* Sidebar buttons */
const SidebarContainer = styled.nav`
    display: flex;
    flex-flow: column;
    width: 100%;
    height: inherit;
    background-color: #a6a6a6;

  
    &-new {
      margin: 2px;
    }
  
    &-group {
      &-editbtn {
        font-size: 0.8em;
        line-height: 14px;
        color: #5c5252;
        text-align: right;
        text-transform: uppercase;
  
        &:hover {
          cursor: pointer;
        }
      }
  
      &-editbtn.background {
        position: relative;
        z-index: 1;
  
        &:before {
          border-top: 2px solid #dfdfdf;
          content: "";
          margin: 0 auto;
          /* this centers the line to the full width specified */
          position: absolute;
          /* positioning must be absolute here, and relative positioning must be applied to the parent */
          top: 50%;
          left: 0;
          right: 0;
          bottom: 0;
          width: 95%;
          z-index: -1;
        }
  
        span {
          /* to hide the lines from behind the text, you have to set the background color the same as the container */
          background: #f0f2f5;
          padding: 0 5px;
        }
      }
  
    }
  
    &.bottom {
      margin-top: auto;
    }
  
    &.children {
      list-style-type: none;
      margin: 0;
      padding-left: 25px;
    }    
  }`

  const SidebarHead = styled.nav`
    background-color: #464646;
    padding: 5;

    > button {
        border-radius: 0;
    }
  `

  const SidebarScrollable = styled.div`
    flex: 2;
    padding: 2 0 2 2;
    overflow-y: scroll;
    scrollbar-width: 12px;
    scrollbar-color: rgb(244, 63, 94) rgb(99, 102, 241);
    
    &::-webkit-scrollbar {
        width: 12px;
    }
    &::-webkit-scrollbar-track {
        background: #a6a6a6;
        border-radius: 6px;
    }
    &::-webkit-scrollbar-thumb {
        background-color: #d5d5d5;
        border-radius: 6px;
        border: 2px solid #a6a6a6;
    }

    > .task-group {
        height: inherit;
        list-style-type: none;
        margin: 0;
        padding: 0;
  
        > li > .btn {
          border: 1px solid #d9d9d9;
          border-radius: 2px;
          margin: 2px;
          color: #363636;
          clear: both;
      
          > .btn-name {
            width: calc(100% - 36px);
            overflow-x: hidden;
            display: block;
            padding: 5px;
      
            &:hover {
              cursor: pointer;
            }
          }
      
          > .btn-icon {
            display: block;
            float: right;
            width: 20px;
            height: 20px;
            margin: 8px;
            color:#d5d5d5;
          }
      
          &.btn-default {
            background-color: #fafafa;
          }
      
          &.btn-active {
            color: #fafafa;
            background-color: #2c70de;
          }
  
          &.btn-valid {
            background-color: #b2cf23;
          }
  
          &.btn-invalid {
            background-color: #cf6565;
          }
        }
      }
  `