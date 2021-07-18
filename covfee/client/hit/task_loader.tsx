import * as React from 'react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import styled from 'styled-components'
import ReactDOM from 'react-dom'
import {
    Button,
    Modal,
    Popover,
} from 'antd';

import { myerror, fetcher, throwBadResponse, makeCancelablePromise, CancelablePromise } from '../utils'
import { getPlayerClass, getTask } from '../task_utils'
import { TaskResponse, TaskSpec, TaskType } from '@covfee-types/task'
import { TaskOverlay } from './overlay'
import { ContinuousTaskPlayer, PlayerStatusType, VideoPlayerContext } from './continuous_task_player'
import buttonManagerContext from '../input/button_manager_context'
import { QuestionCircleOutlined } from '@ant-design/icons'
import { ContinuousTaskProps, CovfeeTask } from 'tasks/base'
import { BinaryDataCaptureBuffer } from '../buffers/binary_dc_buffer'
import { AnnotationBuffer } from 'buffers/buffer';
import { ContinuousPlayerProps, CovfeeContinuousPlayer } from 'players/base';
import { Socket } from 'socket.io-client'

interface State {
    /**
     * Lifecycle states of the loader
     * loading: responses and / or media are being loaded.
     * loaded: (continuous/timed only) responses are loaded. overlay is shown if
     *      - continuous task response is closed (new response is necessary)
     *      - timed task is not started or is finished
     * ready: task is ready to be played / completed. shown when:
     *      - timed task is underway
     *      - continuous task response is open
     *      - all non-continuous, non-timed tasks
     * ended: (continuous only) player called onEnd
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
    replayMode: boolean
    // player : PlayerState
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
    player: {
        loaded: boolean
        paused: boolean
        muted: boolean
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
     * socketio instance for multi-party tasks
     */
    socket: Socket
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

    player: CovfeeContinuousPlayer<any, any>

    response: TaskResponse
    parentResponse: TaskResponse
    taskConstructor: any
    taskReducer: any
    taskStore: any
    taskElement: CovfeeTask<any, any>
    taskInstructionsElem: HTMLDivElement

    mountPromise: CancelablePromise<any>

    buffer: AnnotationBuffer
    parentBuffer: AnnotationBuffer
    endTaskResult: any = null
    // endTaskBuffer: AnnotationBuffer = null
    listeners: {[key: string]: ((...args: any[]) => void)[] } = {}
    
    state: State = {
        status: 'loading',
        renderAs: null,
        replayMode: false,
        player: {
            loaded: false,
            paused: true,
            muted: false
        },
        errorModal: {visible: false},
        overlay: {visible: false},
        instructions: {visible: false}
    }

    constructor(props: Props) {
        super(props)

        const {taskConstructor, taskReducer} = getTask(this.props.task.spec.type)
        this.taskConstructor = taskConstructor
        this.taskReducer = taskReducer

        this.state.renderAs = this.getTaskRenderAs()
        this.state.instructions.visible = (this.props.task.spec.instructionsType == 'popped')

        const loggerMiddleware = storeAPI => next => action => {
            // send actions to the server
            if(!action._fromServer) return this.props.socket.emit('action', action) 
            let result = next(action)
            // console.log('next state', storeAPI.getState())
            return result
        }

        if(taskReducer) {
            this.taskStore = configureStore({
                reducer: {
                    task: this.taskReducer
                },
                middleware: [loggerMiddleware]
            })
        }

        this.props.socket.emit('join', { 'username': 'josedvq', 'room': this.props.task.id.toString() });

        // receive and dispatch actions to the store.
        this.props.socket.on('action', actionObject => {
            // add the fromServer flag to allow it past middleware
            this.taskStore.dispatch({...actionObject, _fromServer: true})
        })

        // if(props.media.speed === 0) {
        //     this.state.player.speed = 1
        //     this.state.player.speedEnabled = true
        // }
        // if(this.isContinuousTask())
        //     this.createBuffers()
    }

    getTaskRenderAs = () => {
        // if(this.props.task.timer && this.props.task.timer.maxTime)
        //     return 'timed-task'
        const taskType = this.taskConstructor.taskType

        let type = 'default'
        if (taskType == 'continuous') type = 'continuous-task'

        return {
            type: type,
            timed: false
        }
    }

    isContinuousTask = () => (this.state.renderAs.type == 'continuous-task')

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
                    status: 'loaded'
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
            replayMode: !annot,
            status: 'ready'
        })

        // this.props.setState({status: 'ready', loading: true})
        if(this.isContinuousTask()) {
            this.player.currentTime(0)
            
            this.createBuffers()
            if(this.state.replayMode) {
                this.loadBuffers().finally(()=>{
                    this.setState({loading: false})
                })
            } else {
                this.setState({loading: false})
            }
        }
    }

    createBuffers = () => {        
        this.buffer = new BinaryDataCaptureBuffer(
            false,
            1,   // sample length
            200, //chunk length
            (this.props.task as any).spec.media.fps || 60,
            this.response.url,
            this.handleBufferError)
    }

    loadBuffers = () => {
        return Promise.all([
            this.buffer ? this.buffer._load() : Promise.resolve(),
            this.parentBuffer ? this.parentBuffer._load(): Promise.resolve()
        ])
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
        if(this.props.task.autoSubmit && !this.state.replayMode)
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

    createPlayerRef = (element: CovfeeContinuousPlayer<any,any>) => {
        this.player = element
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
                if(this.state.replayMode)
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

    /**
     * Player access
     */
     setPaused = (val: boolean) => {
        this.setState({
            player: {
                ...this.state.player,
                paused: val
            }
        })
    }

    setMuted = (val: boolean) => {
        this.setState({
            player: {
                ...this.state.player,
                muted: val
            }
        })
    }

    addListener = (eventName: string, callback: (...args: any[]) => void) => {
        if(!(eventName in this.listeners))
            this.listeners[eventName] = []

        this.listeners[eventName].push(callback)
    }

    dispatch = (eventName: string, ...args: any[]) => {
        if(!(eventName in this.listeners)) return
        this.listeners[eventName].forEach(fn => {
            fn(...args)
        })
    }

    handlePlayerLoad = (duration: number, fps?: number) => {
        this.dispatch('load', duration, fps)
    }

    handlePlayerFrame = (time: number) => {
        this.dispatch('frame', time)
    }

    handlePlayerEnd = () => {
        this.dispatch('end')
    }

    getPlayerContext = () => {
        const ctx: VideoPlayerContext = {
            togglePlayPause: ()=>{this.setPaused(!this.state.player.paused)},
            play: ()=>{this.setPaused(true)},
            pause: ()=>{this.setPaused(false)},
            mute: ()=>{this.setMuted(true)},
            unmute: ()=>{this.setMuted(false)},
            currentTime: (val?: number)=>{return this.player.currentTime(val)},
            addListener: this.addListener,
        }
        return ctx
    }

    renderPlayer = (extraProps: any = {}) => {
        const playerProps = this.taskConstructor.getPlayerProps(this.props.task.spec.media)
        const playerClass = getPlayerClass(playerProps.type)
        const props: ContinuousPlayerProps = {
            ref: this.createPlayerRef,
            media: this.props.task.spec.media,
            paused: this.state.player.paused,
            setPaused: this.setPaused,
            // speed: this.state.player.speed,
            // setSpeed: (this.props.task.spec.media.speed === 0) && this.setSpeed,
            muted: this.state.player.muted,
            setMuted: this.setMuted,
            onLoad: this.handlePlayerLoad,
            onFrame: this.handlePlayerFrame,
            onEnd: this.handlePlayerEnd,
            onEvent: this.dispatch,
            ...extraProps // task can control any non-standard player props it wishes to control
        }
        return React.createElement(playerClass, props, null)
    }

    render() {
        return <>
            {this.renderOverlay()}
            {this.renderErrorModal()}
            <div ref={e=>{this.taskInstructionsElem = e}}></div>
            <div style={{width: '100%'}}>
                {(()=>{
                    if(this.state.status == 'loading') return null

                    const taskElement = React.createElement(this.taskConstructor, {
                        // task props
                        ref: (elem)=>{this.createTaskRef(elem)},
                        spec: this.props.task.spec,
                        dispatch: this.taskStore.dispatch,
            
                        // only provide a response in replay mode, or for secondary tasks
                        response: (this.state.replayMode) ? this.response : null,
                        buffer: this.buffer,
                        renderPlayer: this.renderPlayer,
                        player: this.getPlayerContext(),
                        buttons: this.context.getContext(),
            
                        // task lifecycle
                        onLoad: this.handleTaskLoad,
                        onEnd: this.handleTaskEnd,
                    }, null)

                    if(this.taskReducer) {
                        
                    
                        return <Provider store={this.taskStore}>{taskElement}</Provider>
                    } else {
                        return taskElement
                    }
                })()}
            </div>
        </>
    }
}
TaskLoader.contextType = buttonManagerContext

const InstructionsPopoverContent = styled.div`
    width: calc(30vw);
    max-height: calc(50vh);
`