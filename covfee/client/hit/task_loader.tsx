import * as React from 'react'
import styled from 'styled-components'
import ReactDOM from 'react-dom'
import {
    Button,
    Modal,
    Popover,
} from 'antd';
import classNames from 'classnames'

import { myerror, fetcher, throwBadResponse, makeCancelablePromise, CancelablePromise } from '../utils'
import { getTaskClass } from '../task_utils'
import { TaskResponse, TaskSpec, TaskType } from '@covfee-types/task'
import { AnnotationBuffer } from '../buffers/buffer'
import { TaskOverlay } from './overlay'
import ButtonEventManagerContext from '../input/button_manager'
import { ContinuousTaskPlayer, PlayerStatusType } from './continuous_task_player'
import buttonManagerContext from '../input/button_manager_context'
import { QuestionCircleOutlined } from '@ant-design/icons'
import { CovfeeTask } from 'tasks/base'
import { BasicTaskPlayer } from './basic_task_player';

export interface PlayerState {
    status: PlayerStatusType
    loading: boolean
    currTask: number
    replayMode: boolean
}

interface State {
    /**
     * Lifecycle states of the loader
     * loaded: responses are loaded. overlay is shown if continuous or timed task is submitted
     * ready: task is ready to be played
     * ended: player called onEnd
     * submitted: task has been submitted
     */
    status: 'loading' | 'loaded' | 'ready' | 'ended' | 'submitted'
    renderAs: {
        type: 'continuous-task' | 'default'
        timed: boolean
    }
    /**
     * Player state
     */
    player : PlayerState
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
    /**
     * State of the instructions popover
     */
    instructions: {
        visible: boolean
    }
}

interface Props {
    /**
     * Task props and specification
     */
    task: TaskType
    /**
     * Props and specification of parent task
     */
    parent: TaskType
    /**
     * If true, the task cannot be interacted with
     */
    disabled: boolean
    /**
     * If true, the task is only previewed: submission and server communication are disabled.
     * Used for previews and playground where no server is available.
     */
    previewMode: boolean

    // INTERFACE

    /**
     * Interface mode: used to adjust the way the task is displayed in annotation or timeline modes.
     */
    interfaceMode: 'annotation' | 'timeline'
    renderTaskSubmitButton: (arg0?: any) => React.ReactNode
    renderTaskNextButton: (arg0?: any) => React.ReactNode

    // ASYNC OPERATIONS

    /**
     * Retrieves a response for a given task
     */
    fetchTaskResponse: (arg0: TaskType) => Promise<TaskResponse>
    /**
     * Submits a response to a task
     */
    submitTaskResponse: (arg0: TaskResponse, arg1: any) => Promise<TaskResponse>

    // CALLBACKS
    /**
     * To be called when the task is submitted.
     */
    onSubmit: (arg0: boolean, arg1: boolean)=>void
    /**
     * To be called when the user clicks to go to the next task
     */
    onClickNext: () => void
}

export class TaskLoader extends React.Component<Props, State> {

    response: TaskResponse
    parentResponse: TaskResponse
    taskClass: any
    taskPlayer: React.Component
    taskElement: CovfeeTask<any, any>
    taskInstructionsElem: HTMLDivElement

    mountPromise: CancelablePromise<any>

    endTaskResult: any = null
    endTaskBuffer: AnnotationBuffer = null
    
    state: State = {
        status: 'loading',
        renderAs: null,
        player: {
            status: 'ready',
            loading: true,
            currTask: 0,
            replayMode: false
        },
        errorModal: {visible: false},
        overlay: {visible: false},
        instructions: {visible: false}
    }

    constructor(props: Props) {
        super(props)
        this.taskClass = getTaskClass(this.props.task.spec.type)
        this.state.renderAs = this.getTaskRenderAs()
        this.state.instructions.visible = (this.props.task.spec.instructionsType == 'popped')
    }

    getTaskRenderAs = () => {
        // if(this.props.task.timer && this.props.task.timer.maxTime)
        //     return 'timed-task'
        const taskType = this.taskClass.taskType

        let type = 'default'
        if (taskType == 'continuous') type = 'continuous-task'

        return {
            type: type,
            timed: false
        }
    }

    componentDidMount = () => {
        // read the taks and parent responses.
        this.mountPromise = makeCancelablePromise(Promise.all([
            this.props.fetchTaskResponse(this.props.task).then((response: TaskResponse) => {
                this.response = response
            }),
            this.props.parent && this.props.fetchTaskResponse(this.props.parent).then((response: TaskResponse) => {
                this.parentResponse = response
            })
        ]))
        
        this.mountPromise.promise.then(_ => {
            if(this.response && this.response.submitted) {
                this.setState({
                    status: 'loaded',
                    player: {
                        ...this.state.player,
                        status: 'ended'
                    }
                })
            } else {
                this.loadTask(true)
            }
        })
    }

    componentWillUnmount() {
        this.mountPromise.promise.catch(()=>{})
        this.mountPromise.cancel()
    }


    loadTask = (annot = true) => {
        this.setState({
            player: {
                ...this.state.player, 
                status: 'ready',
                currTask: 0,
                replayMode: !annot
            },
            status: 'ready'
        })
    }

    // Player props
    setPlayerState = (state: PlayerState) => {
        this.setState({
            player: {
                ...this.state.player,
                ...state
            }
        })
    }

    loadTaskForReplay = () => { this.loadTask(false) }

    clearAndReloadTask = () => {
        const url = this.props.task.url +'/make_response?' + new URLSearchParams({
        })

        const requestOptions = {
            method: 'POST'
        }

        return fetcher(url, requestOptions)
            .then(throwBadResponse)
            .then(response => {
                this.response = response
                this.loadTask(true)
            }).catch(error => {
                myerror('Error making task response.', error)
            })
    }


    handleTaskSubmit = (taskResult: any, buffer: AnnotationBuffer, gotoNext=false) => {
        // if(!['annotready'].includes(this.state.status)) {
        //     console.log(`submit() called in invalid state ${this.state.status}.`)
        // }

        (buffer ? buffer.flush() : Promise.resolve())
            .then(()=>{return this.props.submitTaskResponse(this.response, taskResult)})
            .then((data) => {
                this.response = data.response
                this.setState({
                    status: 'submitted'
                })
                this.props.onSubmit(data.valid, gotoNext)
            }).catch((error) => {
                myerror('Error submitting the task.', error)
                this.setState({
                    status: 'ended'
                })
            })
    }

    handleTaskEnd = (taskResult: any, buffer: AnnotationBuffer, timer=false) => {
        // if (!['annotready', 'replayready'].includes(this.state.status))
        //     console.error(`onEnd called in invalid state ${this.state.status}.`)
        if(this.props.task.autoSubmit && !this.state.player.replayMode)
            return this.handleTaskSubmit(taskResult, buffer, false)
        
        this.endTaskResult = taskResult
        this.endTaskBuffer = buffer
        this.setState({
            status: 'ended'
        })
    }

    /**
     * HANDLING OF BUFFER ERRORS
     */
    handleBufferError = (msg: string) => {
        this.setState({
            errorModal: {
                ...this.state.errorModal,
                visible: true,
                message: msg
            }
        })
    }

    handleErrorOk = () => {
        const modalMessage = 'Attempting to submit. The window will be closed if successful.'
        this.setState({
            errorModal: {
                visible: true,
                message: modalMessage,
                loading: true
            }
        })

        // this.buffer.flush(5000)
        // .then(() => {
        //     this.setState({ errorModal: { ...this.state.errorModal, visible: false, loading: false } })
        // }).catch(() => {
        //     this.setState({
        //         errorModal: {
        //             visible: true,
        //             message: modalMessage + ' Unable to send the data. Please communicate with the organizers if the problems persist.',
        //             loading: false
        //         }
        //     })
        // })
    }

    handleErrorCancel = () => {
        this.setState({
            errorModal: {
                ...this.state.errorModal,
                visible: false
            }
        })
    }

    renderErrorModal = () => {
        return <Modal
            title="Error"
            visible={this.state.errorModal.visible}
            confirmLoading={this.state.errorModal.loading}
            onOk={this.handleErrorOk}
            onCancel={this.handleErrorCancel}
            cancelButtonProps={{ disabled: true }}
            okButtonProps={{}}>
            <p>{this.state.errorModal.message}</p>
        </Modal>
    }

    getOverlayInitTimedTask = () => {
        return {
            title: 'This is a timed task!',
            subtext: 'Make sure to set up and be ready before you hit "Start". Once you do you will not be able to stop the countdown.',
            mainOptions: [
                <Button
                    type="primary"
                    onClick={()=>{}}
                >Start</Button>
            ]
        }
    }

    /**
     * User must be able to:
     * - Redo the task if num_submissions < maxSubmissions
     * - Keep replaying the task indefinitely
     * - Go to next task
     */
    getOverlayAfterReplayOrStop = () => {
        return {
            title: 'Replay finished',
            mainOptions:[
                <Button danger
                    type="primary"
                    onClick={this.clearAndReloadTask}
                    disabled={this.props.task.num_submissions >= this.props.task.maxSubmissions}
                    >Restart Task</Button>,

                <Button
                    type="primary"
                    onClick={this.loadTaskForReplay}
                    loading={this.state.overlay.submitting}
                    >Watch again</Button>,

                this.props.renderTaskNextButton()
            ]
        }
    }

    /**
     * User must be able to:
     * - discard and re-do
     * - submit
     * - discard and replay last submission
     */
    getOverlayNonSubmittedTask = () => {
        return {
            title: 'Done!',
            mainOptions: [
                <Button danger
                    type="primary"
                    onClick={this.clearAndReloadTask}
                    disabled={this.props.task.num_submissions >= this.props.task.maxSubmissions}
                    >Discard &amp; Restart</Button>,

                <Button
                    type="primary"
                    onClick={()=>{this.handleTaskSubmit(this.endTaskResult, this.endTaskBuffer)}}
                    loading={this.state.overlay.submitting}
                    >Submit</Button>
            ],
            secondaryOptions: [
                this.props.task.num_submissions > 0 &&
                <Button danger
                    type="text"
                    onClick={this.loadTaskForReplay}
                >Discard and replay last submission</Button>
            ]
        }
    }

    /**
     * User must be able to:
     * - Restart the task if num_submissions < maxSubmissions
     * - Replay the submitted task
     * - Go to the next task
     */
    getOverlaySubmittedTask = () => {
        return {
            title: 'Your task is submitted!',
            mainOptions: [
                <Button danger
                    type="primary"
                    onClick={this.clearAndReloadTask}
                    disabled={this.props.task.num_submissions >= this.props.task.maxSubmissions}
                    >Submit again</Button>,

                <Button
                    type="default"
                    onClick={this.loadTaskForReplay}
                    loading={this.state.overlay.submitting}
                    >Replay submission</Button>,

                this.props.renderTaskNextButton()
            ]
        }
    }

    createTaskRef = (element: CovfeeTask<any,any>) => {
        if(!this.taskInstructionsElem) return
        this.taskElement = element
        if(element && element.instructions) {
            ReactDOM.render(this.renderTaskInfo(element.instructions()), this.taskInstructionsElem)
        } else {
            if(this.props.task.spec.instructions)
                ReactDOM.render(this.renderTaskInfo(null), this.taskInstructionsElem)
        }
    }

    hideInstructions = () => {
        this.setState({
            instructions: {...this.state.instructions, visible: false}
        })
    }
    
    handleInstructionsVisibleChange = (visible: boolean) => {
        this.setState({ instructions: {...this.state.instructions, visible: visible} })
    }

    renderTaskInfo = (instructions: React.ReactNode = null) => {
        return <Popover
                    title="Instructions"
                    placement="bottom"
                    visible={this.state.instructions.visible}
                    onVisibleChange={this.handleInstructionsVisibleChange}
                    content={<InstructionsPopoverContent>
                        {this.props.task.spec.instructions}
                        {instructions}
                        <div style={{textAlign: 'right'}}>
                            <Button type="primary" onClick={this.hideInstructions}>OK</Button>
                        </div>
                    </InstructionsPopoverContent>}
                    trigger="click">
            <div className="task-instructions-button">
                <QuestionCircleOutlined/> Instructions
            </div>
        </Popover>
    }

    renderOverlay = () => {
        switch(this.state.status) {
            case 'loaded':
                if(this.props.task.num_submissions > 0 && this.state.renderAs.type == 'continuous-task')
                    return <TaskOverlay visible={true} {...this.getOverlaySubmittedTask()}/>
                if (this.props.task.timer)
                    return <TaskOverlay visible={true} {...this.getOverlayInitTimedTask()}/>
                break
            case 'ended':
                if(this.state.player.replayMode)
                    return <TaskOverlay visible={true} {...this.getOverlayAfterReplayOrStop()}/>
                else
                    return <TaskOverlay visible={true} {...this.getOverlayNonSubmittedTask()}/>
                
            case 'submitted':
                if(this.state.renderAs.type == 'continuous-task')
                    return <TaskOverlay visible={true} {...this.getOverlaySubmittedTask()}/>
                break
            default:
                return null
        }
    }

    renderContinuousTask = () => {
        const tasks = [this.props.task]
        const responses = [this.response]
        let media = this.props.task.spec.media
        if (this.props.parent) {
            tasks.push(this.props.parent)
            responses.push(this.parentResponse)
            media = this.props.parent.spec.media
        }
        
        return <ContinuousTaskPlayer
            ref={e => { this.taskPlayer = e }}
            status={this.state.player.status}
            disabled={this.props.disabled}
            setState={this.setPlayerState}
            createTaskRef={this.createTaskRef}
            media={media}
            tasks={tasks}
            responses={responses}
            currTask={this.state.player.currTask}
            replayMode={this.state.player.replayMode}
            onBufferError={this.handleBufferError}
            // lifecycle
            onLoad={this.handleTaskLoad}
            onEnd={this.handleTaskEnd} />
    }

    renderTaskDefault = () => {
        return <BasicTaskPlayer
            ref={e => { this.taskPlayer = e }}
            disabled={this.props.disabled}
            createTaskRef={this.createTaskRef}
            task={this.props.task}
            response={this.response}
            replayMode={this.state.player.replayMode}
            onBufferError={this.handleBufferError}
            // lifecycle
            onLoad={this.handleTaskLoad}
            onSubmit={this.handleTaskSubmit}
            // interface
            renderTaskSubmitButton={this.props.renderTaskSubmitButton}/>
    }    

    render() {
        return <>
            {this.renderOverlay()}
            {this.renderErrorModal()}
            <div ref={e=>{this.taskInstructionsElem = e}}></div>
            <div style={{width: '100%'}}>
                <ButtonEventManagerContext>
                    {(()=>{
                        if(this.state.status == 'loading') return null
                        switch (this.state.renderAs.type) {
                            case 'continuous-task':
                                return this.renderContinuousTask()
                            default:
                                return this.renderTaskDefault()
                        }
                    })()}
                </ButtonEventManagerContext>
            </div>
        </>
    }
}
ContinuousTaskPlayer.contextType = buttonManagerContext

const InstructionsPopoverContent = styled.div`
    width: calc(30vw);
    max-height: calc(50vh);
`