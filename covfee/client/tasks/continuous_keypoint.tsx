// declare global cv;
import * as React from 'react'
import {
    Typography,
} from 'antd';
const { Title, Text } = Typography
import MouseTracker from '../input/mouse_tracker'
import MouseVisualizer from '../input/mouse_visualizer'
import { withCookies } from 'react-cookie'
import { ContinuousTaskProps, CovfeeContinuousTask, TaskInfo } from './base'
import { ContinuousKeypointTaskSpec} from '@covfee-types/tasks/continuous_keypoint'
import { TaskType } from '@covfee-types/task';
import { OpencvFlowPlayerMedia } from '@covfee-types/players/opencv';

interface Props extends TaskType, ContinuousTaskProps {
    spec: ContinuousKeypointTaskSpec
}

interface State {
    occluded: boolean,
    mouse_valid: boolean,
    opticalFlowEnabled: boolean,
}
export class ContinuousKeypointTask extends CovfeeContinuousTask<Props, State> {
    static taskInfo: TaskInfo = {
        supportsVisualization: true
    }

    state: State = {
        occluded: false,
        mouse_valid: false,
        opticalFlowEnabled: true,
    }
    tracker = React.createRef<MouseTracker>()
    mouse_normalized = [0,0]

    constructor(props: Props) {
        super(props)
        this.state.opticalFlowEnabled = (this.props.cookies.get('opticalFlowEnabled') === 'true')
    }

    static getPlayerProps = (media: OpencvFlowPlayerMedia) => {
        return {
            type: 'OpencvFlowPlayer'
        }
    }

    componentDidMount() {
        this.props.buttons.addListener('speedup', 'ArrowRight', 'Increase playback speed.')
            .addEvent('keydown', (e: Event) => {
                
            })

        this.props.buttons.addListener('speeddown', 'ArrowLeft', 'Decrease playback speed.')
            .addEvent('keydown', (e: Event) => {
                
            })

        this.props.buttons.addListener('play', ' ', 'Toggle play/pause the video.')
            .addEvent('keydown', (e: Event) => {
                this.props.player.togglePlayPause()
            })

        this.props.buttons.addListener('back2s', 'x', 'Go back 2s.')
            .addEvent('keydown', (e: Event) => {
                
            })

        this.props.buttons.addListener('back10s', 'c', 'Go back 10s.')
            .addEvent('keydown', (e: Event) => {
                
            })

        this.props.buttons.addListener('occlusion', 'z', 'Toggle occlusion flag.')
            .addEvent('keydown', (e: Event) => {
                this.toggleOcclusion()
            })

        this.props.buttons.addListener('opticalflow', 'v', 'Toggle optical flow-based speed adjustment.')
            .addEvent('keydown', (e: Event) => {
                this.handleToggleOpticalFlow()
            })

        this.props.player.addListener('frame', this.handleFrame)
        this.props.player.addListener('end', this.handleVideoEnded)
    }

    componentWillUnmount() {
        this.props.buttons.removeListener('speedup')
        this.props.buttons.removeListener('speeddown')
        this.props.buttons.removeListener('play')
        this.props.buttons.removeListener('back2s')
        this.props.buttons.removeListener('back10s')
        this.props.buttons.removeListener('occlusion')
        this.props.buttons.removeListener('opticalflow')
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


    handleToggleOpticalFlow = () => {
        this.props.cookies.set('opticalFlowEnabled', !this.state.opticalFlowEnabled);
        this.setState({
            opticalFlowEnabled: !this.state.opticalFlowEnabled
        })
    }

    // Replaying logic
    // Takes care of replaying an annotation given a log

    // writes mouse position to the buffer on every frame
    handleFrame = (frame: number, delay: number) => {
        if(this.props.replayMode) {
            this.replayUntilFrame(frame)
        } else {
            // this.props.buffer(
            //     frame,
            //     [...this.mouse_normalized, this.state.mouse_valid ? 1 : 0, this.state.occluded ? 1 : 0]
            // )
        }
    }

    handleVideoEnded = () => {
        this.props.onEnd(null)
    }

    // recreate annotation (replay mode) until the given frame
    replayUntilFrame = (frame: number) => {
        let action = this.props.getCurrReplayAction()

        while (action != null && action[2] <= frame) {
            this.replayAction(action)
            action = this.props.getNextReplayAction()
        }
    }

    replayAction = (action: Array<any>) => {
        
        if(typeof action[3] == 'number') {
            this.mouse_normalized = [action[3], action[4]]
            this.setState({
                mouse_valid: !!action[5],
                occluded: !!action[6],
                replayMode: {
                    ...this.state.replayMode,
                    data: [action[3], action[4]]
                }
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

    

    // startReverseCount = () => {
    //     this.setState({
    //         reverseCount: {
    //             visible: true,
    //             count: 3
    //         }
    //     })

    //     this.reverseCountTimerId = window.setInterval(() => {
    //         if (this.state.reverseCount.count == 1) {
    //             // play the video
    //             this.cancelReverseCount()
    //             this.handlePausePlay(false)
    //         } else {
    //             this.setState({
    //                 reverseCount: {
    //                     ...this.state.reverseCount,
    //                     count: this.state.reverseCount.count - 1
    //                 }
    //             })
    //         }
    //     }, 800)
    // }

    // cancelReverseCount = (cb?: Function) => {
    //     if (this.reverseCountTimerId != null) {
    //         window.clearInterval(this.reverseCountTimerId)
    //         this.reverseCountTimerId = null
    //     }
    //     this.setState({
    //         reverseCount: {
    //             ...this.state.reverseCount,
    //             visible: false,
    //         }
    //     }, () => { if (cb) cb() })
    // }


    wrapPlayer = () => {
        return <MouseVisualizer disable={!this.props.replayMode} data={this.state.replayMode.data}>

        </MouseVisualizer>
    }

    render() {
        if(this.props.playerElement) {
            return <>
                <MouseTracker
                    disable={this.props.replayMode} // disable mouse tracking in replay mode
                    paused={false}
                    occluded={this.state.occluded}
                    mouseActive={this.state.mouse_valid}
                    onData={this.handleMouseData} 
                    onMouseActiveChange={this.handleMouseActiveChange} 
                    ref={this.tracker}>
                        {this.props.playerElement}
                        {/* <OpencvFlowPlayer
                            media={this.props.spec.media}
                            paused={this.state.paused}
                            opticalFlowEnabled={this.state.opticalFlowEnabled}
                            pausePlay={this.handlePausePlay}
                            rate={this.playbackRates[this.state.playbackRateIdx]}
                            getMousePosition={this.getMousePosition}
                            ref={this.player}
                            onEnded={this.handleVideoEnded}
                            onLoad={this.handleVideoLoad}
                            onError={this.handleVideoError}
                            onFrame={this.handleFrame}>
                            </OpencvFlowPlayer> */}
                </MouseTracker>
            </>
        } else return null
    }

    instructions = () => {
        return <>
            
        </>
    }
}

export default withCookies(ContinuousKeypointTask)