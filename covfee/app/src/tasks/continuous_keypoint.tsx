import * as React from 'react'
import {
    Button,
    Modal
} from 'antd';
import { ReloadOutlined, CaretRightOutlined, ClockCircleOutlined } from '@ant-design/icons';
import OpencvFlowPlayer from 'Players/opencv'
import '../css/gui.css'
import MouseTracker from 'Input/mouse_tracker'
import MouseVisualizer from 'Input/mouse_visualizer'
import classNames from 'classnames'

interface Props {
    name: string,
    media: any,
    onEnd: Function, // should be called when the task ends
    buffer: Function,
    replayMode: boolean,
    getCurrReplayAction: Function,
    getNextReplayAction: Function
}
interface State {
    paused: boolean,
    occluded: boolean,
    mouse_valid: boolean,
    playbackRateIdx: number,
    duration: number,
    currentTime: number,
    currentFrame: number,
    reverseCount: {
        visible: boolean,
        count: number
    },
    replayMode: {
        data: Array<number>
    }
}
class ContinuousKeypointTask extends React.Component<Props, State> {
    state: State = {
        paused: true,
        occluded: false,
        mouse_valid: false,
        playbackRateIdx: 6,
        duration: 0,
        currentTime: 0,
        currentFrame: 0,
        reverseCount: {
            visible: false,
            count: 0
        },
        replayMode: {
            data: null
        }
    }
    private playbackRates = [1/8, 1/7, 1/6, 1/5, 1/4, 1/3, 1/2, 1, 2, 3, 4]
    private player = React.createRef<OpencvFlowPlayer>()
    private tracker = React.createRef<MouseTracker>()
    private mouse_normalized = [0,0]
    private reverseCountTimerId: number = null

    componentDidMount() {
        document.addEventListener("keydown", this.handleKeydown, false)
    }

    componentWillUnmount() {
        document.removeEventListener("keydown", this.handleKeydown, false)
    }

    speedup = () => {
        this.setState({ playbackRateIdx: Math.min(this.state.playbackRateIdx + 1, this.playbackRates.length - 1) })
    }

    speeddown = () => {
        this.setState({ playbackRateIdx: Math.max(this.state.playbackRateIdx - 1, 0) })
    }

    back2s = () => {
        const t1 = Math.max(0, this.player.current.currentTime() - 2)
        this.goto(t1)
    }

    back10s = () => {
        const t2 = Math.max(0, this.player.current.currentTime() - 10)
        this.goto(t2)
    }

    handleKeydown = (e: KeyboardEvent) => {
        if (e.repeat) {
            e.preventDefault()
            e.stopPropagation()
            return 
        }
        switch (e.key) {
            case 'ArrowRight':
                this.speedup()
                this.props.buffer(this.player.current.currentFrame(), ['speedup', this.playbackRates[this.state.playbackRateIdx]])
                break
            case 'ArrowLeft':
                this.speeddown()
                this.props.buffer(this.player.current.currentFrame(), ['speeddown', this.playbackRates[this.state.playbackRateIdx]])
                break
            case ' ':
                e.preventDefault()
                if (this.state.paused) this.props.buffer(this.player.current.currentFrame(), ['play'])
                else this.props.buffer(this.player.current.currentFrame(), ['pause'])
                this.togglePlayPause()
                break
            case 'x': // => go back 2s
                this.back2s()
                this.props.buffer(this.player.current.currentFrame(), ['back2s'])
                break
            case 'c': // => go back 10s
                this.back10s()
                this.props.buffer(this.player.current.currentFrame(), ['back10s'])
                break
            case 'z': // occluded
                if(!this.props.replayMode) this.toggleOcclusion()
                break
            default:
                break
        }
    }

    private toggleOcclusion = () => {
        this.setState({ occluded: !this.state.occluded })
    }

    private goto = (time: number) => {
        this.player.current.currentTime(time)
        this.cancelReverseCount(this.startReverseCount)
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

    handleVideoLoad = (vid:HTMLVideoElement) => {
        this.setState({duration: vid.duration})
    }

    // Replaying logic
    // Takes care of replaying an annotation given a log

    // writes mouse position to the buffer on every frame
    handleFrame = (frame: number) => {
        if(this.props.replayMode) {
            this.replayUntilFrame(frame)
        } else {
            this.props.buffer(
                frame,
                [...this.mouse_normalized, this.state.mouse_valid ? 1 : 0, this.state.occluded ? 1 : 0]
            )
        }
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

    handleVideoEnded = () => {
        this.setState({
            paused: true
        }, ()=>{
            this.props.onEnd({success: true})
        })
    } 

    togglePlayPause = () => {
        if(this.props.replayMode) {
            // play immediately in replay mode
            return this.handlePausePlay(!this.state.paused)
        }

        if(this.state.paused) {
            if(this.state.reverseCount.visible) {
                this.cancelReverseCount()
            } else {
                this.startReverseCount()
            }
        } else {
            this.handlePausePlay(true)
        }
    }

    handlePausePlay = (pause: boolean, cb?: Function) => {
        this.setState({
            paused: pause,
            currentTime: this.player.current.currentTime(),
            currentFrame: this.player.current.currentFrame()
        }, () => { if (cb) cb() })
    }

    startReverseCount = () => {
        this.setState({
            reverseCount: {
                visible: true,
                count: 3
            }
        })

        this.reverseCountTimerId = window.setInterval(() => {
            if (this.state.reverseCount.count == 1) {
                // play the video
                this.cancelReverseCount()
                this.handlePausePlay(false)
            } else {
                this.setState({
                    reverseCount: {
                        ...this.state.reverseCount,
                        count: this.state.reverseCount.count - 1
                    }
                })
            }
        }, 800)
    }

    cancelReverseCount = (cb?: Function) => {
        if (this.reverseCountTimerId != null) {
            window.clearInterval(this.reverseCountTimerId)
            this.reverseCountTimerId = null
        }
        this.setState({
            reverseCount: {
                ...this.state.reverseCount,
                visible: false,
            }
        }, () => { if (cb) cb() })
    }

    

    render() {
        const playerOptions = {
            muted: true,
            fps: this.props.media.fps,
            video: {
                src: this.props.media.url,
                res: this.props.media.res,
                type: 'video/mp4'
            },
            flow: {
                src: this.props.media.flow_url,
                res: this.props.media.flow_res,
                type: 'video/mp4'
            }
        }
        let pr = this.playbackRates[this.state.playbackRateIdx]
        let pr_str = ''
        if(Number.isInteger(pr)) pr_str = pr.toString()
        else pr_str = pr.toFixed(2)

        return <>
            <div className="annot-bar">
                <div className="annot-bar-header">{this.props.name}</div>
                <div className="annot-bar-section"><CaretRightOutlined /> {pr_str}x</div>
                {this.state.paused ? <div className="annot-bar-section"><ClockCircleOutlined /> {this.state.currentTime.toFixed(1)} / {this.state.duration.toFixed(1)}</div> : <></>}
                {this.state.paused ? <div className="annot-bar-section">frame {this.state.currentFrame}</div> : <></>}
                {this.state.reverseCount.visible ? <div className="annot-bar-section" style={{'color': 'red'}}>{this.state.reverseCount.count}</div> : <></>}
            </div>
            <MouseTracker
                disable={this.props.replayMode} // disable mouse tracking in replay mode
                paused={this.state.paused}
                occluded={this.state.occluded}
                mouseActive={this.state.mouse_valid}
                onData={this.handleMouseData} 
                onMouseActiveChange={this.handleMouseActiveChange} 
                ref={this.tracker}>
                
                <MouseVisualizer disable={!this.props.replayMode} data={this.state.replayMode.data}>
                    <OpencvFlowPlayer
                        {...playerOptions}
                        paused={this.state.paused}
                        pausePlay={this.handlePausePlay}
                        rate={this.playbackRates[this.state.playbackRateIdx]}
                        getMousePosition={this.getMousePosition}
                        ref={this.player}
                        onEnded={this.handleVideoEnded}
                        onLoad={this.handleVideoLoad}
                        onFrame={this.handleFrame}>
                        </OpencvFlowPlayer>
                </MouseVisualizer>
            </MouseTracker>
        </>
    }
}

export default ContinuousKeypointTask