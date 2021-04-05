import * as React from 'react'
import {
    Row,
    Col,
    Typography
} from 'antd'
const { Title } = Typography
import { ClockCircleOutlined } from '@ant-design/icons';
import HTML5Player from '../players/html5'
import '../css/gui.css'
import { OneDIntensity } from '../input/1d_intensity'
import keyboardManagerContext from '../input/keyboard_manager_context'
import { TaskObject} from '@covfee-types/task'
import { ReplayableTaskProps } from './props'
import { Continuous1DTaskSpec} from '@covfee-types/tasks/continuous_1d'

interface Props extends TaskObject, ReplayableTaskProps {
    spec: Continuous1DTaskSpec
}

interface State {
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

    // intensity reading
    intensity: number

    player = React.createRef<HTML5Player>()
    reverseCountTimerId: number = null
    frameUpdateTimerId: number = null

    buttonEvents = {
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

    constructor(props: Props) {
        super(props)

        // update default keyboard keys with props
        if (props.spec.controls) {
            for (const [id, key] of Object.entries(props.spec.controls)) {
                this.buttonEvents[id]['key'] = key
            }
        }
    }

    componentDidMount() {
        this.context.addEvents(this.buttonEvents)
        this.props.setInstructionsFn(this.instructions)
    }

    componentWillUnmount() {
        this.context.removeEvents(this.buttonEvents)
        if (this.frameUpdateTimerId) clearInterval(this.frameUpdateTimerId)
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

    // Replaying logic
    // Takes care of replaying an annotation given a log
    // writes output to the buffer on every frame
    handleFrame = (frame: number) => {
        if (this.props.replayMode) {
            this.replayUntilFrame(frame)
        } else {
            this.props.buffer(
                frame,
                [this.intensity]
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

    updateTime = () => {
        this.setState({
            currentTime: this.player.current.currentTime(),
            currentFrame: this.player.current.currentFrame()
        })
    }

    handlePausePlay = (pause: boolean, cb?: Function) => {
        this.setState({
            paused: pause,
        }, () => { if (cb) cb() })

        if(pause) {
            if (this.frameUpdateTimerId) clearInterval(this.frameUpdateTimerId)
        } else {
            this.frameUpdateTimerId = setInterval(this.updateTime, 1000)
        }
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
        }, 300)
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

    // important: do not call setState here (can impair performance)
    setIntensity = (val: number) => {
        this.intensity = val
    }

    render() {
        return <>
            <div className="annot-bar">
                <div className="annot-bar-section"><ClockCircleOutlined /> {this.state.currentTime.toFixed(0)} / {this.state.duration.toFixed(1)}</div>
                {this.state.reverseCount.visible ? <div className="annot-bar-section" style={{ 'color': 'red' }}>{this.state.reverseCount.count}</div> : <></>}
            </div>
            <Row>
                <Col span={20}>
                    <HTML5Player
                        media={this.props.spec.media}
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
                        setIntensity={this.setIntensity}
                        input={this.props.spec.intensityInput} />
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
Continuous1DTask.contextType = keyboardManagerContext
export default Continuous1DTask