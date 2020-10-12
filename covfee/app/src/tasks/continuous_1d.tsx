import * as React from 'react'
import {
    Button,
    Modal,
    Row,
    Col
} from 'antd';
import { ReloadOutlined, CaretRightOutlined, ClockCircleOutlined } from '@ant-design/icons';
import HTML5Player from 'Players/html5'
import '../css/gui.css'
import classNames from 'classnames'
import { OneDIntensityFeedback } from 'Input/1d_intensity_feedback';

interface Props {
    taskName: string,
    media: any,
    onEnd: Function, // should be called when the task ends
    buffer: Function,
    replayMode: boolean,
    getCurrReplayAction: Function,
    getNextReplayAction: Function
}
interface State {
    intensity: number,
    paused: boolean,
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
class Continuous1DTask extends React.Component<Props, State> {
    state: State = {
        intensity: 0,
        paused: true,
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
    private player = React.createRef<HTML5Player>()
    private reverseCountTimerId: number = null

    componentDidMount() {
        document.addEventListener("keydown", this.handleKeydown, false)
    }

    componentWillUnmount() {
        document.removeEventListener("keydown", this.handleKeydown, false)
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
            default:
                break
        }
    }

    private goto = (time: number) => {
        this.player.current.currentTime(time)
        this.cancelReverseCount(this.startReverseCount)
    }

    handleVideoLoad = (vid: HTMLVideoElement) => {
        this.setState({ duration: vid.duration })
    }

    // Replaying logic
    // Takes care of replaying an annotation given a log
    // writes output to the buffer on every frame
    handleFrame = (frame: number) => {
        if (this.props.replayMode) {
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

        if (typeof action[3] == 'number') {
            this.mouse_normalized = [action[3], action[4]]
            this.setState({
                replayMode: {
                    ...this.state.replayMode,
                    data: [action[3], action[4]]
                }
            })
            return
        }
        switch (action[1]) {
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
        }, () => {
            this.props.onEnd({ success: true })
        })
    }

    togglePlayPause = () => {
        if (this.props.replayMode) {
            // play immediately in replay mode
            return this.handlePausePlay(!this.state.paused)
        }

        if (this.state.paused) {
            if (this.state.reverseCount.visible) {
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

    setIntensity = (val: number) => {
        this.setState({
            intensity: val
        })
    }

    render() {
        const playerOptions = {
            fps: this.props.media.fps,
            video: {
                src: this.props.media.url,
                res: this.props.media.res,
                type: 'video/mp4'
            }
        }

        return <>
            <div className="annot-bar">
                <div className="annot-bar-header">{this.props.taskName}</div>
                {this.state.paused ? <div className="annot-bar-section"><ClockCircleOutlined /> {this.state.currentTime.toFixed(1)} / {this.state.duration.toFixed(1)}</div> : <></>}
                {this.state.paused ? <div className="annot-bar-section">frame {this.state.currentFrame}</div> : <></>}
                {this.state.reverseCount.visible ? <div className="annot-bar-section" style={{ 'color': 'red' }}>{this.state.reverseCount.count}</div> : <></>}
            </div>
            <Row>
                <Col span={20}>
                    <HTML5Player
                        {...playerOptions}
                        paused={this.state.paused}
                        pausePlay={this.handlePausePlay}
                        ref={this.player}
                        onEnded={this.handleVideoEnded}
                        onLoad={this.handleVideoLoad}
                        onFrame={this.handleFrame}>
                    </HTML5Player>
                </Col>
                <Col span={4}>
                    <OneDIntensityFeedback 
                        intensity={this.state.intensity}
                        setIntensity={this.setIntensity}/>
                </Col>
            </Row>
            
        </>
    }
}

export default Continuous1DTask