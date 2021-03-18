import * as React from 'react'
import {
    Button,
    Modal,
    Row,
    Col,
    List,
    Typography
} from 'antd'
const { Title, Text } = Typography
import { ReloadOutlined, CaretRightOutlined, ClockCircleOutlined } from '@ant-design/icons';
import HTML5Player from '../players/html5'
import '../css/gui.css'
import classNames from 'classnames'
import { OneDIntensity } from '../input/1d_intensity'
import { BaseTaskProps, ReplayableTaskProps } from './task'
import keyboardManagerContext from '../input/keyboard_manager_context'

interface Props extends BaseTaskProps, ReplayableTaskProps { }

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

class VideoRecallTask extends React.Component<Props, State> {
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

    player = React.createRef<HTML5Player>()
    reverseCountTimerId: number = null

    keyboardEvents = {
        'play-pause': {
            key: ' ',
            description: 'Play/pause the video and data capture.',
            handler: (e: Event) => {
                if (this.state.paused) this.props.buffer(this.player.current.currentFrame(), ['play'])
                else this.props.buffer(this.player.current.currentFrame(), ['pause'])
                this.togglePlayPause()
            }
        },
        'back2s': {
            key: 'c',
            description: 'Go back 2 seconds',
            handler: () => {
                this.back2s()
                this.props.buffer(this.player.current.currentFrame(), ['back2s'])
            }
        },
        'back10s': {
            key: 'x',
            description: 'Go back 10 seconds',
            handler: () => {
                this.back10s()
                this.props.buffer(this.player.current.currentFrame(), ['back10s'])
            }
        }
    }

    constructor(props: Props, context) {
        super(props, context)

        // update default keyboard keys with props
        if (props.controls) {
            for (const [id, key] in Object.entries(props.controls)) {
                this.keyboardEvents[id]['key'] = key
            }
        }
    }

    componentDidMount() {
        this.context.addEvents(this.keyboardEvents)
        this.props.setInstructionsFn(this.instructions)
    }

    componentWillUnmount() {
        this.context.removeEvents(this.keyboardEvents)
    }

    back2s = () => {
        const t1 = Math.max(0, this.player.current.currentTime() - 2)
        this.goto(t1)
    }

    back10s = () => {
        const t2 = Math.max(0, this.player.current.currentTime() - 10)
        this.goto(t2)
    }

    private goto = (time: number) => {
        this.player.current.currentTime(time)
        this.cancelReverseCount(this.startReverseCount)
    }

    handleVideoLoad = (vid: HTMLVideoElement) => {
        this.setState({ duration: vid.duration })
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
        return <>
            <div className="annot-bar">
                {this.state.paused ? <div className="annot-bar-section"><ClockCircleOutlined /> {this.state.currentTime.toFixed(1)} / {this.state.duration.toFixed(1)}</div> : <></>}
                {this.state.paused ? <div className="annot-bar-section">frame {this.state.currentFrame}</div> : <></>}
                {this.state.reverseCount.visible ? <div className="annot-bar-section" style={{ 'color': 'red' }}>{this.state.reverseCount.count}</div> : <></>}
            </div>
            <Row>
                <Col span={20}>
                    <HTML5Player
                        {...this.props.media}
                        paused={this.state.paused}
                        pausePlay={this.handlePausePlay}
                        ref={this.player}
                        onEnded={this.handleVideoEnded}
                        onLoad={this.handleVideoLoad}
                        onFrame={this.handleFrame}>
                    </HTML5Player>
                </Col>
                <Col span={4}>
                    <OneDIntensity
                        disabled={this.props.replayMode}
                        intensity={this.state.intensity}
                        setIntensity={this.setIntensity}
                        keys={['ArrowUp', 'ArrowRight']} />
                </Col>
            </Row>
        </>
    }

    instructions = () => {
        return <>
            <Row>
                <Col span={24}>
                    <Title level={4}>Keyboard controls</Title>
                    {this.context.renderInfo()}
                </Col>
            </Row>
        </>
    }
}
VideoRecallTask.contextType = keyboardManagerContext
export default VideoRecallTask