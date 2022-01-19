// declare global cv;
import * as React from 'react'
import log from 'loglevel'
import {
    Typography,
} from 'antd';
const { Title, Text } = Typography
import MouseTracker from '../input/mouse_tracker'
import MouseVisualizer from '../input/mouse_visualizer'
import { ContinuousTaskProps, CovfeeContinuousTask } from './base'
import { ContinuousKeypointTaskSpec} from '@covfee-types/tasks/continuous_keypoint'
import { TaskType } from '@covfee-types/task';
import { OpencvFlowPlayerMedia } from '@covfee-types/players/opencv';
import { LoginOutlined } from '@ant-design/icons';

interface Props extends TaskType, ContinuousTaskProps {
    spec: ContinuousKeypointTaskSpec
}

interface State {
    occluded: boolean
    mouse_valid: boolean
    opticalFlowEnabled: boolean
    playbackRateIdx: number
}
export default class ContinuousKeypointTask extends CovfeeContinuousTask<Props, State> {
    static taskInfo = {
        bufferDataLen: 2
    }

    state: State = {
        occluded: false,
        mouse_valid: false,
        opticalFlowEnabled: true,
        playbackRateIdx: 7
    }
    tracker = React.createRef<MouseTracker>()
    mouse_normalized = [0,0]

    private playbackRates = [1/10, 1/8, 1/6, 1/5, 1/4, 1/3, 1/2, 1, 2, 3, 4]

    updateMouseVisualization: (arg0: [number, number]) => void

    constructor(props: Props) {
        super(props)
        let opticalFlowEnabled = null
        if(typeof localStorage !== 'undefined') {
            opticalFlowEnabled = localStorage.getItem('opticalFlowEnabled')
        }

        if(opticalFlowEnabled !== null) {
            this.state.opticalFlowEnabled = (opticalFlowEnabled == '1')
        }
        if(props.response !== null)
            this.state.opticalFlowEnabled = false
        
        log.info(`constructing task ${this.props.myKey}`)
    }

    componentDidMount() {
        log.info(`mounting task ${this.props.myKey}`)
        this.props.buttons.addListener('speedup', 'ArrowRight', 'Increase playback speed.')
            .addEvent('keydown', (e: Event) => {
                this.speedup()
            })

        this.props.buttons.addListener('speeddown', 'ArrowLeft', 'Decrease playback speed.')
            .addEvent('keydown', (e: Event) => {
                this.speeddown()
            })

        this.props.buttons.addListener('play', ' ', 'Toggle play/pause the video.')
            .addEvent('keydown', (e: Event) => {
                this.props.player.togglePlayPause()
            })

        this.props.buttons.addListener('back2s', 'x', 'Go back 2s.')
            .addEvent('keydown', (e: Event) => {
                this.back2s()
            })

        this.props.buttons.addListener('back10s', 'c', 'Go back 10s.')
            .addEvent('keydown', (e: Event) => {
                this.back10s()
            })

        this.props.buttons.addListener('occlusion', 'z', 'Toggle occlusion flag.')
            .addEvent('keydown', (e: Event) => {
                this.toggleOcclusion()
            })

        this.props.buttons.addListener('opticalflow', 'v', 'Toggle optical flow-based speed adjustment.')
            .addEvent('keydown', (e: Event) => {
                this.toggleOpticalFlow()
            })

        this.props.player.addListener('frame', this.handleFrame)
        this.props.player.addListener('end', this.handleVideoEnded)
    }

    componentWillUnmount() {
        log.info(`unmounting task ${this.props.myKey}`)
        this.props.buttons.removeListener('speedup')
        this.props.buttons.removeListener('speeddown')
        this.props.buttons.removeListener('play')
        this.props.buttons.removeListener('back2s')
        this.props.buttons.removeListener('back10s')
        this.props.buttons.removeListener('occlusion')
        this.props.buttons.removeListener('opticalflow')

        this.props.player.removeListeners('frame')
        this.props.player.removeListeners('end')
    }

    speedup = () => {
        this.setState({ playbackRateIdx: Math.min(this.state.playbackRateIdx + 1, this.playbackRates.length - 1) })
    }

    speeddown = () => {
        this.setState({ playbackRateIdx: Math.max(this.state.playbackRateIdx - 1, 0) })
    }

    back2s = () => {
        const t = Math.max(0, (this.props.player.currentTime() as number) - 2)
        this.props.player.currentTime(t)
    }

    back10s = () => {
        const t = Math.max(0, (this.props.player.currentTime() as number) - 10)
        this.props.player.currentTime(t)
    }

    toggleOcclusion = () => {
        this.setState({ occluded: !this.state.occluded })
    }

    // stores mouse data sent by the mouse tracker
    handleMouseData = (data: any) => {
        // this.mouse = [e.offsetX, e.offsetY]
        this.mouse_normalized = data
    }

    // used by the flow player to get the mouse position
    getMousePosition = () => {
        return this.mouse_normalized
    }

    handleMouseActiveChange = (status: boolean) => {
        this.setState({ mouse_valid: status })
    }


    setOpticalFlowEnabled = (value: boolean) => {
        this.setState({
            opticalFlowEnabled: value
        }, () => { 
            // if(localStorage) {
            //     localStorage.setItem('opticalFlowEnabled', value ? '1' : '0')
            // }
        })
    }

    toggleOpticalFlow = () => {
        this.setOpticalFlowEnabled(!this.state.opticalFlowEnabled)
    }

    // Replaying logic
    // Takes care of replaying an annotation given a log

    // writes mouse position to the buffer on every frame
    handleFrame = (time: number) => {
        if(this.props.response) {
            this.replayUntil(time)
        } else {
            this.props.buffer.data(
                time,
                [...this.mouse_normalized, this.state.mouse_valid ? 1 : 0, this.state.occluded ? 1 : 0]
            )
        }
    }

    handleVideoEnded = () => {
        this.props.onEnd(null)
    }

    // recreate annotation (replay mode) until the given frame
    replayUntil = (time: number) => {
        let data, logs
        [data, logs] = this.props.buffer.read(time)

        if(data)
            this.updateMouseVisualization([data[1], data[2]])

        // if(logs) {
        //     logs.forEach(log => {
        //         this.replayAction(log[2])
        //     })
        // }
    }

    replayAction = (action: Array<any>) => {
        
        if(typeof action[3] == 'number') {
            this.mouse_normalized = [action[3], action[4]]
            this.setState({
                mouse_valid: !!action[5],
                occluded: !!action[6]
            })
            return
        }
        switch(action[1]) {
            case 'speedup': 
                this.speedup()
                break
            case 'speeddown':
                this.speeddown()
                break
            case 'back2s':
                this.back2s()
                break
            case 'back10s':
                this.back10s()
                break
            default:
        }
    }

    wrapPlayerElement = (elem: React.ReactNode ) => {
        return <MouseTracker
            disable={this.props.response !== null} // disable mouse tracking in replay mode
            paused={false}
            occluded={this.state.occluded}
            mouseActive={this.state.mouse_valid}
            onData={this.handleMouseData} 
            onMouseActiveChange={this.handleMouseActiveChange}>

            <MouseVisualizer 
                disable={this.props.response === null}
                ref={e=>{if(e) this.updateMouseVisualization = e.setData}}>
                {elem}
            </MouseVisualizer>
        </MouseTracker>
    }

    render() {
        return <>
                {this.props.renderPlayer({
                    type: 'OpencvFlowPlayer',
                    media: this.props.spec.media,
                    opticalFlowEnabled: this.state.opticalFlowEnabled,
                    setOpticalFlowEnabled: this.setOpticalFlowEnabled,
                    playbackRateMultiplier: this.playbackRates[this.state.playbackRateIdx],
                    getMousePosition: this.getMousePosition,
                    wrapPlayerElement: this.wrapPlayerElement
                })}
        </>
    }

    instructions = () => {
        return this.props.buttons.renderInfo()
    }
}
