import * as React from 'react'
import styled from 'styled-components'
import ReactDOM from 'react-dom'
import {
    Button,
    Popover,
    Spin,
} from 'antd';

import { myerror } from '../utils'
import { getTask } from '../task_utils'
import { TaskResponseType, TaskType } from '../types/node'
import buttonManagerContext from '../input/button_manager_context'
import { QuestionCircleOutlined } from '@ant-design/icons'
import { CovfeeTask } from 'tasks/base'
import { useNode } from '../models/Node';
import { NodeType } from '../types/node';
import { AllPropsRequired } from '../types/utils';
import { useNodeState } from '../nodes/state';

interface State {
    /**
     * Lifecycle states of the loader
     * loading: responses / state are being loaded.
     * loaded: (continuous/timed only) responses / state are loaded. overlay is shown if
     *      - continuous task response is closed (new response is necessary)
     *      - timed task is not started or is finished
     * player-loading (continuous only): continuous player is being loaded
     * ready: task is ready to be played / completed. shown when:
     *      - timed task is underway
     *      - continuous task response is open
     *      - all non-continuous, non-timed tasks
     * ended: (continuous only) player called onEnd
     * submitted: task has been submitted
     */
    status: 'loading' | 'loaded' | 'player-loading' | 'ready' | 'ended' | 'submitted'
    /**
     * Key, causes task to be reloaded on replay / re-do
     */
    taskKey: number,
    /**
     * State of the error modal 
     */
    errorModal: {
        visible: boolean
        message?: string
        loading?: boolean
    },
    /**
     * State of the overlay shown at the end of tasks
     */
    overlay: {
        visible: boolean
        submitting?: boolean
    }
}

interface Props {
    /**
     * Task props and specification
     */
    node: NodeType
    /**
     * If true, the task cannot be interacted with
     */
    disabled?: boolean
    /**
     * If true, the task is only previewed: submission and server communication are disabled.
     * Used for previews and playground where no server is available.
     */
    previewMode?: boolean

    // INTERFACE

    /**
     * Passed to tasks to render the submit button
     */
    renderSubmitButton: (arg0?: any) => React.ReactNode
    /**
     * Used in the class to render the "next" button
     */
    renderNextButton: (arg0?: any) => React.ReactNode
    // CALLBACKS
    /**
     * To be called when the task is submitted.
     */
    onSubmit?: () => void
    /**
     * To be called when the user clicks to go to the next task
     */
    onClickNext?: () => void
}

// type defaultProps = Required<Pick<Props, 'parent' | 'disabled' | 'previewMode' | 'interfaceMode' | 'renderTaskSubmitButton' | 'renderTaskNextButton' | 'fetchTaskResponse' | 'submitTaskResponse' | 'onSubmit' | 'onClickNext'>>



export const NodeLoader = (props: Props) => {
    const args: AllPropsRequired<Props> = {
        disabled: false,
        previewMode: false,
        onSubmit: () => {},
        onClickNext: () => {},
        ...props,
    }

    const [status, setStatus] = React.useState('loading')
    const [isLoading, setIsLoading] = React.useState(true)
    const [instructionsVisible, setInstructionsVisible] = React.useState(false)
    const [overlayVisible, setOverlayVisible] = React.useState(false)

    const {taskConstructor, taskReducer} = getTask(args.node.spec.type)
    const {node, setNode, response, makeResponse, fetchResponse, submitResponse} = useNode(args.node);

    

    const nodeElementRef = React.useRef(null)
    const nodeInstructionsRef = React.useRef(null)

    // const state = useNodeState();


    const canSubmit = () => {
        return !props.node.submitted
    }

    // const isTask = () => args.node.spec.nodeType == 'task'

    React.useEffect(() => {
        fetchResponse().then((response: TaskResponseType) => {
            setIsLoading(false)
        })

        if(args.node.spec.nodeType == 'task') {
            args.node.spec.instructionsType == 'popped'
        }
    }, [])    

    const handleTaskSubmit = (taskResult: any) => {
        submitResponse(taskResult)
            .then((data:any) => {
                setStatus('submitted')
                args.onSubmit()
            }).catch((error) => {
                myerror('Error submitting the task.', error)
                setStatus('ended')
            })
    }

    // const renderErrorModal = () => {
    //     return <Modal
    //         title="Error"
    //         visible={this.state.errorModal.visible}
    //         confirmLoading={this.state.errorModal.loading}
    //         onOk={this.handleErrorOk}
    //         onCancel={this.handleErrorCancel}
    //         cancelButtonProps={{ disabled: true }}
    //         okButtonProps={{}}>
    //         <p>{this.state.errorModal.message}</p>
    //     </Modal>
    // }

    // const getOverlayInitTimedTask = () => {
    //     return {
    //         title: 'This is a timed task!',
    //         subtext: 'Make sure to set up and be ready before you hit "Start". Once you do you will not be able to stop the countdown.',
    //         mainOptions: [
    //             <Button
    //                 type="primary"
    //                 onClick={()=>{}}
    //             >Start</Button>
    //         ]
    //     }
    // }

    /**
     * User must be able to:
     * - Restart the task if num_submissions < maxSubmissions
     * - Replay the submitted task
     * - Go to the next task
     */
    const getOverlaySubmittedTask = () => {
        return {
            title: 'Your task is submitted!',
            mainOptions: [
                args.renderNextButton()
            ]
        }
    }

    const createTaskRef = (element: CovfeeTask<any,any>) => {
        nodeElementRef.current = element
        if(element && element.instructions) {
            ReactDOM.render(renderTaskInfo(element.instructions()), nodeInstructionsRef.current)
        } else {
            if(node.spec.instructions)
                ReactDOM.render(renderTaskInfo(null), nodeInstructionsRef.current)
        }
    }

    const hideInstructions = () => {
        setInstructionsVisible(false)
    }
    
    const handleInstructionsVisibleChange = (visible: boolean) => {
        setInstructionsVisible(visible)
    }

    const renderTaskInfo = (instructions: React.ReactNode = null) => {
        return <Popover
                    title="Instructions"
                    placement="bottom"
                    visible={instructionsVisible}
                    onVisibleChange={handleInstructionsVisibleChange}
                    content={<InstructionsPopoverContent>
                        {node.spec.instructions}
                        {instructions}
                        <div style={{textAlign: 'right'}}>
                            <Button type="primary" onClick={hideInstructions}>OK</Button>
                        </div>
                    </InstructionsPopoverContent>}
                    trigger="click">
            <div className="task-instructions-button">
                <QuestionCircleOutlined/> Instructions
            </div>
        </Popover>
    }

    if(isLoading) return <Spin/>
    
    return <>
        
        {/* {renderErrorModal()} */}
        <div ref={nodeInstructionsRef}></div>
        <div style={{width: '100%', height: '100%', position: 'relative'}}>
            
            {(()=>{
                const nodeProps = {
                    spec: node.spec,
                    response: response,
                    disabled: args.disabled,
                    onSubmit: res => handleTaskSubmit(res),
                    renderSubmitButton: args.renderSubmitButton
                }

                console.log(taskConstructor)

                const taskElement = React.createElement(taskConstructor, {
                    ref: (elem: any)=>{createTaskRef(elem)},
                    ...nodeProps
                }, null)

                return taskElement
            })()}
        </div>
    </>
}

const InstructionsPopoverContent = styled.div`
    width: calc(30vw);
    max-height: calc(50vh);
`