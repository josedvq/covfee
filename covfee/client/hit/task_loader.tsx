import * as React from 'react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import styled from 'styled-components'
import ReactDOM from 'react-dom'
import {
    Button,
    Modal,
    Popover,
    Spin
} from 'antd';

import { log, myerror, fetcher, throwBadResponse, makeCancelablePromise, CancelablePromise } from '../utils'
import { getPlayerClass, getTask } from '../task_utils'
import { TaskResponse, TaskSpec, TaskType } from '@covfee-shared/spec/task'
import { TaskOverlay } from './overlay'
import buttonManagerContext from '../input/button_manager_context'
import { QuestionCircleOutlined } from '@ant-design/icons'
import { CommonTaskProps, BasicTaskProps, ContinuousTaskProps, CovfeeTask } from 'tasks/base'
import { ContinuousPlayerProps, CovfeeContinuousPlayer } from 'players/base';

export interface VideoPlayerContext {
    paused: boolean
    muted: boolean
    togglePlayPause: () => void
    play: () => void
    pause: () => void
    mute: () => void
    unmute: () => void
    currentTime: (arg0?: number, callback?: ()=>{}) => number | void
    addListener: (arg0: string, arg1: (...args: any[]) => void) => void
    removeListeners: (arg0: string) => void
}

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
    taskInfo: {
        type: 'continuous-task' | 'default'
        timed: boolean
    }
    /**
     * Key, causes task to be reloaded on replay / re-do
     */
    taskKey: number,
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
        duration: number
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
    parent?: TaskType
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
     * Interface mode: used to adjust the way the task is displayed in annotation or timeline modes.
     */
    interfaceMode?: 'annotation' | 'timeline'
    /**
     * Passed to tasks to render the submit button
     */
    renderTaskSubmitButton: (arg0?: any) => React.ReactNode
    /**
     * Used in the class to render the "next" button
     */
    renderTaskNextButton: (arg0?: any) => React.ReactNode

    // ASYNC OPERATIONS

    /**
     * Retrieves a response for a given task
     */
    fetchTaskResponse?: (arg0: TaskType) => Promise<TaskResponse>
    /**
     * Submits a response to a task
     */
    submitTaskResponse?: (arg0: TaskResponse, arg1: any) => Promise<TaskResponse>

    // CALLBACKS
    /**
     * To be called when the task is submitted.
     */
    onSubmit?: (source: 'task' | 'modal') => void
    /**
     * To be called when the user clicks to go to the next task
     */
    onClickNext?: () => void
}

type defaultProps = Required<Pick<Props, 'parent' | 'disabled' | 'previewMode' | 'interfaceMode' | 'renderTaskSubmitButton' | 'renderTaskNextButton' | 'fetchTaskResponse' | 'submitTaskResponse' | 'onSubmit' | 'onClickNext'>>

const defaultProps = Object.freeze<defaultProps>({
    parent: null,
    disabled: false,
    previewMode: false,
    interfaceMode: 'annotation',
    renderTaskSubmitButton: null,
    renderTaskNextButton: null,
    fetchTaskResponse: () => Promise.resolve(null),
    submitTaskResponse: () => Promise.resolve(null),
    onSubmit: () => {},
    onClickNext: () => {}
})

export class TaskLoader extends React.Component<Props & defaultProps, State> {

    static defaultProps = defaultProps

    player: CovfeeContinuousPlayer<any, any>

    response: TaskResponse
    parentResponse: TaskResponse
    taskConstructor: any
    taskReducer: any
    taskStore: any
    taskElement: CovfeeTask<any, any>
    taskInstructionsElem: HTMLDivElement


    loadPromise: CancelablePromise<any>

    endTaskResult: any = null
    listeners: {[key: string]: ((...args: any[]) => void)[] } = {}

    _playerLoaded: Promise<any>
    _playerLoadedResolve: Function
    _playerLoadedReject: Function
    
    state: State = {
        status: 'loading',
        taskInfo: null,
        replayMode: false,
        taskKey: 0,
        player: {
            duration: null,
            loaded: false,
            paused: true,
            muted: false
        },
        errorModal: {visible: false},
        overlay: {visible: false},
        instructions: {visible: false}
    }

    constructor(props: Props & defaultProps) {
        super(props)

        const {taskConstructor, taskReducer} = getTask(this.props.task.spec.type)

        this.taskConstructor = taskConstructor
        this.taskReducer = taskReducer

        this.state.taskInfo = this.getTaskRenderAs()
        this.state.instructions.visible = (this.props.task.spec.instructionsType == 'popped')
        
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

    get isContinuous() {
        return (this.state.taskInfo.type == 'continuous-task')
    }

    isMaxSubmissionsReached = () => {
        return (this.props.task.maxSubmissions && this.props.task.num_submissions >= this.props.task.maxSubmissions)
    }

    componentDidMount = () => {
        log.debug(`task_loader componentDidMount() with status=${this.state.status} renderAs.type = "${this.state.taskInfo.type}", replayMode=${this.state.replayMode}`)
        // read the taks and parent responses.
        this.loadPromise = makeCancelablePromise(Promise.all([
            this.props.fetchTaskResponse(this.props.task).then((response: TaskResponse) => {
                this.response = response
            }),
            this.props.parent && this.props.fetchTaskResponse(this.props.parent).then((response: TaskResponse) => {
                this.parentResponse = response
            })
        ]))
        
        this.loadPromise.promise.then(_ => {
            this.reloadTask(false, true)
        })
    }

    reloadTask = (replay = false, initialLoad=false) => {
        if(this.isContinuous) {
            
            this._playerLoaded = new Promise((resolve, reject) => {
                this._playerLoadedResolve = resolve
                this._playerLoadedReject = reject
            })
            this.setState({
                status: 'player-loading',
                taskKey: this.state.taskKey + 1,
            })

            // wait for the player to load
            this._playerLoaded.then((mediaDuration: number)=> {

                const makeBuffersPromise = (initialLoad && this.response && this.response.submitted) ? 
                    Promise.resolve() :
                    this.makeContinuousBuffers(mediaDuration, replay)

                makeBuffersPromise.then(()=>{
                    this.setState({
                        replayMode: replay,
                        status: (initialLoad && this.response && this.response.submitted) ? 'loaded' : 'ready',
                        player: {
                            ...this.state.player,
                            paused: true,
                            duration: mediaDuration
                        }
                    })
                })
            })
        } else {
            this.setState({
                replayMode: replay,
                status: 'ready',
                taskKey: this.state.taskKey + 1
            })
        }
    }

    componentWillUnmount() {
        this.loadPromise.promise.catch(()=>{})
        this.loadPromise.cancel()
    }
    
    loadTaskForReplay = () => { this.reloadTask(true) }

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
                this.reloadTask(false)
            }).catch(error => {
                myerror('Error making task response.', error)
            })
    }


    handleTaskSubmit = (taskResult: any, source: ('task' | 'modal')) => {
        (this.buffer ? this.buffer.flush() : Promise.resolve())
            .then(()=>{return this.props.submitTaskResponse(this.response, taskResult)})
            .then((data:any) => {
                this.response = data.response
                this.setState({
                    status: 'submitted'
                })
                this.props.onSubmit(source)
            }).catch((error) => {
                myerror('Error submitting the task.', error)
                this.setState({
                    status: 'ended'
                })
            })
    }

    handleTaskEnd = (taskResult: any, timer=false) => {
        if(this.props.task.autoSubmit && !this.state.replayMode)
            return this.handleTaskSubmit(taskResult, 'modal')
        
        this.endTaskResult = taskResult
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
                    disabled={this.isMaxSubmissionsReached()}
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
                    disabled={this.isMaxSubmissionsReached()}
                    >Discard &amp; Restart</Button>,

                <Button
                    type="primary"
                    onClick={()=>{this.handleTaskSubmit(this.endTaskResult, 'modal')}}
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
                    disabled={this.isMaxSubmissionsReached()}
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

    renderOverlay = () => {
        switch(this.state.status) {
            case 'loaded':
                if(this.props.task.num_submissions > 0 && this.state.taskInfo.type == 'continuous-task')
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
                if(this.state.taskInfo.type == 'continuous-task')
                    return <TaskOverlay visible={true} {...this.getOverlaySubmittedTask()}/>
                break
            default:
                return null
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

    removeListeners = (eventName: string) => {
        if(eventName in this.listeners)
            delete this.listeners[eventName]
    }

    dispatchPlayerEvent = (eventName: string, ...args: any[]) => {
        if(!(eventName in this.listeners)) return
        this.listeners[eventName].forEach(fn => {
            fn(...args)
        })
    }

    handlePlayerLoad = (duration: number, fps?: number) => {
        log.debug(`handlePlayerLoad called, duration=${duration}`)
        this._playerLoadedResolve(duration)
        // this.setState({player: {...this.state.player, 'duration': duration}}, ()=>{
        //     this._playerLoadedResolve()
        // })
        this.dispatchPlayerEvent('load', duration, fps)
    }

    handlePlayerFrame = (time: number) => {
        this.dispatchPlayerEvent('frame', time)
    }

    handlePlayerEnd = () => {
        this.setState({
            player: {...this.state.player, paused: true}
        })
        this.dispatchPlayerEvent('end')
    }

    getPlayerContext = () => {
        const ctx: VideoPlayerContext = {
            paused: this.state.player.paused,
            muted: this.state.player.muted,
            togglePlayPause: ()=>{this.setPaused(!this.state.player.paused)},
            play: ()=>{this.setPaused(true)},
            pause: ()=>{this.setPaused(false)},
            mute: ()=>{this.setMuted(true)},
            unmute: ()=>{this.setMuted(false)},
            currentTime: (val?: number)=>{return this.player.currentTime(val)},
            addListener: this.addListener,
            removeListeners: this.removeListeners
        }
        return ctx
    }

    renderPlayer = (propsFromTask: any = {}) => {
        const playerClass = getPlayerClass(propsFromTask.type)
        const props: ContinuousPlayerProps = {
            ...propsFromTask, // task can control any non-standard player props it wishes to control
            ref: this.createPlayerRef,
            paused: this.state.player.paused,
            setPaused: this.setPaused,
            muted: this.state.player.muted,
            setMuted: this.setMuted,
            onLoad: this.handlePlayerLoad,
            onFrame: this.handlePlayerFrame,
            onEnd: this.handlePlayerEnd,
            onEvent: this.dispatchPlayerEvent,
        }
        return React.createElement(playerClass, props, null)
    }

    render() {
        log.debug(`task_loader render() with status=${this.state.status} renderAs.type = "${this.state.taskInfo.type}", replayMode=${this.state.replayMode}`)

        if(this.state.status == 'loading') return <Spin/>
        
        return <>
            
            {this.renderErrorModal()}
            {this.renderOverlay()}
            <div ref={e=>{this.taskInstructionsElem = e}}></div>
            <div style={{width: '100%', height: '100%', position: 'relative'}}>
                
                {(()=>{
                    let commonProps: CommonTaskProps = {
                        spec: this.props.task.spec,
                        response: (this.isContinuous && !this.state.replayMode) ? null : this.response,
                        buttons: this.context.getContext(),
                        getSharedState: this.getSharedState
                    }
                    if('taskSpecific' in this.props.task) {
                        commonProps = {...commonProps, ...this.props.task.taskSpecific}
                    }

                    let taskTypeProps: any
                    if(this.state.taskInfo.type == 'default') {
                        const basicTaskProps: BasicTaskProps = {
                            ...commonProps,
                            disabled: this.props.disabled,
                            onSubmit: (res) => this.handleTaskSubmit(res, 'task'),
                            renderSubmitButton: this.props.renderTaskSubmitButton
                        }

                        taskTypeProps = basicTaskProps
                        
                    } else {
                        const continuousTaskProps: ContinuousTaskProps = {
                            ...commonProps,
                            player: this.getPlayerContext(),
                            renderPlayer: this.renderPlayer,
                            
                            // task lifecycle
                            onEnd: this.handleTaskEnd,
                        }

                        taskTypeProps = continuousTaskProps
                    }

                    const taskElement = React.createElement(this.taskConstructor, {
                        key: this.state.taskKey,
                        myKey: this.state.taskKey,
                        ref: (elem: any)=>{this.createTaskRef(elem)},
                        ...taskTypeProps
                    }, null)

                    return taskElement
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