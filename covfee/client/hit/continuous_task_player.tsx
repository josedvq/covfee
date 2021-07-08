import * as React from 'react'

import { getPlayerClass, getTaskClass } from '../task_utils'
import { TaskType } from '@covfee-types/task'
import { AnnotationBuffer } from '../buffers/buffer';
import { CovfeeContinuousPlayer, ContinuousPlayerProps } from '../players/base';
import { BinaryDataCaptureBuffer } from '../buffers/binary_dc_buffer';

import buttonManagerContext from '../input/button_manager_context'
import { VideoSpec } from '@covfee-types/players/media';
import { CovfeeContinuousTask, CovfeeTask } from 'tasks/base';
import { PlayerState } from './task_loader';

export interface VideoPlayerContext {
    togglePlayPause: () => void
    play: () => void
    pause: () => void
    mute: () => void
    unmute: () => void
    currentTime: (arg0?: number, callback?: ()=>{}) => number | void
    setSpeed: (arg0: number) => void
    addListener: (arg0: string, arg1: (...args: any[]) => void) => void
    //optional
    setActiveMedia?: (arg0: number) => void
}


interface State {
    refsReady: boolean

    player: {
        loaded: boolean
        paused: boolean
        speed: number
        speedEnabled: boolean
        muted: boolean
        activeMedia: number
    }
}

export type PlayerStatusType = 'ready' | 'ended'
interface Props {
    status: PlayerStatusType
    loading: boolean
    setState: (arg0: Partial<PlayerState>) => null
    /**
     * List of tasks to be displayed. Only one of these (currTask) is active.
     */ 
    tasks: TaskType[]
    /**
     * The media to use.
     */
    media: VideoSpec
    /**
     * Current task responses to be used by the player
     */
    responses: any[]
    /**
     * Main task: the task to be completed (ie. active task) by the user. The rest of the tasks can only be visualized
     */
    currTask: number
    /**
     * Annotation or replay mode?
     */
    replayMode: boolean
    
    onBufferError: (arg0: string) => void

    // lifecycle
    onLoad: ()=>void
    onEnd: (taskResult: any, buffer: AnnotationBuffer, timer:boolean) => void
    createTaskRef: (e: CovfeeTask<any,any>) => void
}


export class ContinuousTaskPlayer extends React.Component<Props, State> {

    static defaultProps = {
        status: 'ready'
    }

    buffers: AnnotationBuffer[]
    taskElements: any[] = []

    player: CovfeeContinuousPlayer<any, any>
    /**
     * Stores listeners to the player component, added by tasks
     */
    listeners: {[key: string]: ((...args: any[]) => void)[] } = {}

    state: State = {
        refsReady: false,
        player: {
            loaded: false,
            paused: true,
            speed: null,
            speedEnabled: true,
            muted: false,
            activeMedia: 0
        }
    }

    constructor(props: Props) {
        super(props)
        if(props.media.speed === 0) {
            this.state.player.speed = 1
            this.state.player.speedEnabled = true
        }
        this.createBuffers()
    }

    componentDidMount() {
        if(this.props.status == 'ready') this.loadReadyState()
        if(this.props.status == 'ended') this.loadEndedState()
    }

    componentDidUpdate(prevProps: Props) {
        if(this.props.status != prevProps.status) {
            if(this.props.status == 'ready') {
                this.loadReadyState()
            }
        }
    }

    loadEndedState = () => {
        this.props.setState({status: 'ended', loading: false})
    }

    loadReadyState = () => {
        this.props.setState({status: 'ready', loading: true})
        if(this.player)
            this.player.currentTime(0)
        this.createBuffers()
        if(this.props.replayMode) {
            this.loadBuffers().finally(()=>{
                this.props.setState({loading: false})
            })
        } else {
            this.props.setState({loading: false})
        }
    }

    createBuffers = () => {        
        this.buffers = this.props.responses.map((response, index) => {
            return new BinaryDataCaptureBuffer(
                (index !== this.props.currTask),
                1,   // sample length
                200, //chunk length
                this.props.media.fps || 60,
                response.url,
                this.props.onBufferError)
        })
    }

    loadBuffers = () => {
        return Promise.all(this.buffers.map((buff, index) => {
            if (this.props.responses[index] && this.props.responses[index].submitted)
                return buff._load()
            else return Promise.resolve()
        }))
    }

    /**
     * Reference creation
     */
    createTaskRef = (index: number, element: any) => {
        this.taskElements[index] = element
        const numRefs = this.taskElements.reduce((acc, cv) => (cv) ? acc + 1 : acc, 0)
        if (numRefs === this.props.tasks.length && !this.state.refsReady) this.setState({ refsReady: true})
        if (index === this.props.currTask) this.props.createTaskRef(element)
    }

    createPlayerRef = (element: CovfeeContinuousPlayer<any,any>) => {
        this.player = element
    }

    /**
     * Task lifecycle
     */
    handleTaskLoad = () => {
        this.props.onLoad()
    }

    handleTaskEnd = (response: any) => {
        this.props.setState({status: 'ended'})
        this.props.onEnd(response, this.buffers[this.props.currTask], false)
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

    setSpeed = (val: number) => {
        this.setState({
            player: {
                ...this.state.player,
                speed: val
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

    setActiveMedia = (num: number) => {
        this.setState({
            player: {
                ...this.state.player,
                activeMedia: num
            }
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

    getListenerContext = () => {
        const ctx: VideoPlayerContext = {
            togglePlayPause: ()=>{},
            play: ()=>{},
            pause: ()=>{},
            mute: ()=>{},
            unmute: ()=>{},
            currentTime: ()=>{return null},
            setSpeed: ()=>{},
            addListener: this.addListener,
            // optional
            setActiveMedia: ()=>{}
        }
        return ctx
    }

    getControllerContext = () => {
        const ctx: VideoPlayerContext = {
            togglePlayPause: ()=>{this.setPaused(!this.state.player.paused)},
            play: ()=>{this.setPaused(true)},
            pause: ()=>{this.setPaused(false)},
            mute: ()=>{this.setMuted(true)},
            unmute: ()=>{this.setMuted(false)},
            currentTime: (val?: number)=>{return this.player.currentTime(val)},
            setSpeed: this.setSpeed,
            addListener: this.addListener,
            // optional
            setActiveMedia: this.setActiveMedia
        }
        return ctx
    }

    render() {
        /**
         * Rendering order:
         * 1. render all tasks
         * 3. once all refs are set, render the player calling task wrapping methods
         * 4. load the buffers using the fps from the player
         * 4. render aux interface calling the parents wrapping methods
         * 5. tasks receive onload with the duration information
         */
        // NOTE: the duration is set by the player

        let playerElement: any = null
        if (this.state.refsReady) { // load the player
            const currTask = this.props.tasks[this.props.currTask]
            const taskClass = getTaskClass(currTask.spec.type)
            const playerProps = taskClass.getPlayerProps(this.props.media)
            const playerClass = getPlayerClass(playerProps.type)
            const props: ContinuousPlayerProps = {
                ref: this.createPlayerRef,
                media: this.props.media,
                activeMedia: this.state.player.activeMedia,
                paused: this.state.player.paused,
                setPaused: this.setPaused,
                speed: this.state.player.speed,
                setSpeed: (this.props.media.speed === 0) && this.setSpeed,
                muted: this.state.player.muted,
                setMuted: this.setMuted,
                onLoad: this.handlePlayerLoad,
                onFrame: this.handlePlayerFrame,
                onEnd: this.handlePlayerEnd,
                onEvent: this.dispatch
            }
            playerElement = React.createElement(playerClass, props, null)
        }

        return <>            
            {this.props.tasks.map((task, index) => {
                const taskClass = getTaskClass(task.spec.type)
                const isCurrTask = (index === this.props.currTask)

                return React.createElement(taskClass, {
                    key: index,

                    // task props
                    ref: (elem)=>{this.createTaskRef(index, elem)},
                    spec: task.spec,
                    // only provide a response in replay mode, or for secondary tasks
                    response: (!isCurrTask || this.props.replayMode) ? this.props.responses[index] : null,
                    buffer: this.buffers[index],
                    playerElement: isCurrTask ? playerElement : null,
                    player: isCurrTask ? this.getControllerContext(): this.getListenerContext(),
                    buttons: isCurrTask ? this.context.getContext() : this.context.getDummyContext(),

                    // task lifecycle
                    onLoad: isCurrTask ? this.handleTaskLoad : () => {},
                    onEnd: isCurrTask ? this.handleTaskEnd : ()=>{},
                }, null)
            })}
        </>

    }
}
ContinuousTaskPlayer.contextType = buttonManagerContext
