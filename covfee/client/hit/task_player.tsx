import * as React from 'react'

import { getPlayerClass, getTaskClass } from '../task_utils'
import { TaskType } from '@covfee-types/task'
import { AnnotationBuffer } from '../buffers/buffer';
import { BasePlayerProps, PlayerListenerProps } from '@covfee-types/players/base';
import { BinaryDataCaptureBuffer } from '../buffers/binary_dc_buffer';
import { ClockCircleOutlined } from '@ant-design/icons';

interface State {
    status: 'loading' | 'initready' | 'replayready' | 'replaystarted' | 'replayended'

    refsReady: boolean
    playerLoaded: boolean
    paused: boolean
}

interface Props {
    // getPlayer: (arg0: BasePlayerProps)=>{}
    tasks: TaskType[]
    responses: any[]
    currTask: number
    replayMode: boolean
    // response: TaskResponse
    
    onVideoLoad: () => void
    onBufferLoad: () => void
    onBufferError: (arg0: string) => void
    onEnd: (taskResult: any, buffer: AnnotationBuffer, timer:boolean) => void
    // renderPlayer: (arg0: RenderPlayerProps) => React.ReactElement
}


export class TaskPlayer extends React.Component<Props, State> {

    buffers: AnnotationBuffer[]
    taskElements: any[] = []
    playerElement: React.ReactElement

    mediaDuration: number = 0
    mediaFps: number = 0
    currentTime: number = 0

    playerListeners: { [key: string]: Function[] } = {}

    taskLoaded: number[]

    state: State = {
        status: 'loading',
        refsReady: false,
        playerLoaded: false,
        paused: true
    }

    constructor(props: Props) {
        super(props)
        this.createBuffers()
    }

    createBuffers = () => {
        this.buffers = this.props.tasks.map((task, index) => {
            return new BinaryDataCaptureBuffer(
                (index !== this.props.currTask),
                1,   // sample length
                200, //chunk length
                this.mediaFps || 60,
                task.url,
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

    /* TASK LIFECYCLE
     */
    handleTaskSubmit = () => {
        this.props.onEnd({}, this.buffers[this.props.currTask], false)
    }

    createTaskRef = (index: number, element: any) => {
        this.taskElements[index] = element
        const numRefs = this.taskElements.reduce((acc, cv) => (cv) ? acc + 1 : acc, 0)
        if (numRefs === this.props.tasks.length && !this.state.refsReady) this.setState({ refsReady: true})
    }

    createPlayerRef = (element: React.ReactElement) => {
        this.playerElement = element
    }


    setPlayerListeners = (props: PlayerListenerProps) => {
        Object.entries(props).forEach(([listenerName, listener]) => {
            if (!(listenerName in this.playerListeners)) {
                this.playerListeners[listenerName] = []
            }
            this.playerListeners[listenerName].push(listener)
        })
    }

    handlePlayerLoad = (duration: number, fps: number) => {
        this.props.onVideoLoad()
        this.mediaDuration = duration
        this.mediaFps = fps
        if(!('load' in this.playerListeners)) return
        const loadListeners = this.playerListeners['load']
        for (let i = 0; i < loadListeners.length; i++)
            loadListeners[i](duration, fps)
    }

    handleFrame = (time: number) => {
        this.currentTime = time
        const frameListeners = this.playerListeners['frame']
        for (let i = 0; i < frameListeners.length; i++)
            frameListeners[i](time)
    }

    handlePlayerEvent = (eventName: string, ...eventArgs: any[]) => {
        if (!(eventName in this.playerListeners)) return
        const listeners = this.playerListeners[eventName]
        for (let i = 0; i < listeners.length; i++) {
            listeners[i](...eventArgs)
        }

    }

    handleEnd = () => {
        this.props.onEnd({}, this.buffers[this.props.currTask], false)
    }

    setPaused = (paused: boolean) => {
        this.setState({paused: paused})
    }

    getCurrentTime = () => {
        return this.currentTime
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

        let player:any = null
        if (this.state.refsReady) { // load the player
            const currTask = this.props.tasks[this.props.currTask]
            const taskClass = getTaskClass(currTask.spec.type)
            // const media = this.props.tasks[this.props.currTask].spec.media
            const playerProps = taskClass.getPlayerProps(this.props.media)
            const playerClass = getPlayerClass(playerProps.type)
            player = React.createElement(playerClass, {
                ref: this.createPlayerRef,
                media: this.props.media,
                paused: this.state.paused,
                setPaused: this.setPaused,
                onLoad: this.handlePlayerLoad,
                onFrame: this.handleFrame,
                onEnd: this.handleEnd,
                onEvent: this.handlePlayerEvent
            }, null)
        }
        
        return <>
            {this.state.refsReady &&
                <div className="annot-bar">
                    <div className="annot-bar-section"><ClockCircleOutlined /> {this.currentTime.toFixed(0)} / {this.mediaDuration.toFixed(0)}</div>
                    {/* {this.state.reverseCount.visible ? <div className="annot-bar-section" style={{ 'color': 'red' }}>{this.state.reverseCount.count}</div> : <></>} */}
                </div>
            }
            
            {this.props.tasks.map((task, index) => {
                const taskClass = getTaskClass(task.spec.type)
                const isCurrTask = (index === this.props.currTask)

                return React.createElement(taskClass, {
                    key: index,
                    // task props
                    ref: elem => {this.createTaskRef(index, elem)},
                    spec: task.spec,
                    player: isCurrTask ? player: null,
                    setPlayerListeners: this.setPlayerListeners,

                    // visualization
                    visualizationModeOn: !isCurrTask || this.props.replayMode,
                    buffer: this.buffers[index],
                    response: this.props.responses[index],

                    // task lifecycle
                    paused: this.state.paused,
                    setPaused: this.setPaused,
                    onLoad: () => {},
                    // onFrame: this.props.onFrame,
                    currentTime: this.getCurrentTime,
                    onEnd: ()=>{},
                    onSubmit: isCurrTask? this.handleTaskSubmit: ()=>{}
                }, null)
            })}
        </>

    }
}