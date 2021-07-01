import * as React from 'react'

import { getTaskClass } from '../task_utils'
import { TaskType } from '@covfee-types/task'
import { AnnotationBuffer } from '../buffers/buffer';
import { BinaryDataCaptureBuffer } from '../buffers/binary_dc_buffer';

import buttonManagerContext from '../input/button_manager_context'
import { CovfeeTask } from '../tasks/base';
import { Button } from 'antd';


interface State {
    refsReady: boolean
}

interface Props {
    task: TaskType
    response: any
    replayMode: boolean
    submitButtonText: string
    
    onBufferError: (arg0: string) => void

    // lifecycle
    onLoad: ()=>void
    onSubmit: (taskResult: any, buffer: AnnotationBuffer, timer:boolean) => void
    createTaskRef: (e: CovfeeTask<any,any>) => void
}


export class BasicTaskPlayer extends React.Component<Props, State> {

    buffer: AnnotationBuffer
    taskElement: any

    state: State = {
        refsReady: false,
    }

    constructor(props: Props) {
        super(props)
        this.createBuffers()
    }

    createBuffers = () => {        
        // TODO: implement buffer in log-only mode for basic tasks
    }

    loadBuffers = () => {
        // TODO: implement buffer in log-only mode for basic tasks
    }

    /**
     * Task lifecycle
     */
    handleTaskLoad = () => {
        this.props.onLoad()
    }

    handleTaskSubmit = (response: any, buffer: any, gotoNext=false) => {
        this.props.onSubmit(response, buffer, gotoNext)
    }

    renderSubmitButton = (extraProps: any) => {
        return <Button type="primary" htmlType="submit" {...extraProps}>
            {this.props.submitButtonText}
        </Button>
    }

    render() {
        const taskClass = getTaskClass(this.props.task.spec.type)
        return React.createElement(taskClass, {
            // task props
            ref: (elem)=>{this.props.createTaskRef(elem)},
            spec: this.props.task.spec,
            disabled: (this.props.task.prerequisite && this.props.task.valid),
            // only provide a response in replay mode, or for secondary tasks
            response: this.props.response,
            buttons: this.context.getContext(),

            // task lifecycle
            onLoad: this.handleTaskLoad,
            onSubmit: this.handleTaskSubmit,
            
            renderSubmitButton: this.renderSubmitButton
        }, null)
    }
}
BasicTaskPlayer.contextType = buttonManagerContext
