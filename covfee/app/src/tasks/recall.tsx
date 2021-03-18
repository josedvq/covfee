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
import { BaseTaskProps, ReplayableTaskProps, VideoSpec } from './task'
import keyboardManagerContext from '../input/keyboard_manager_context'

interface MemVideoSpec extends VideoSpec {
    segment_urls: Array<string>
}
interface Props extends BaseTaskProps, ReplayableTaskProps {
    media: MemVideoSpec
}
interface State {
    currSegment: number,
    recall: number,
    paused: boolean,
    duration: number,
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
        currSegment: -1,
        recall: 0,
        paused: true,
        duration: 0,
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
        // this.context.addEvents(this.keyboardEvents)
        this.props.setInstructionsFn(this.instructions)
    }

    componentWillUnmount() {
        this.context.removeEvents(this.keyboardEvents)
    }

    handleVideoLoad = (vid: HTMLVideoElement) => {
        this.setState({ duration: vid.duration })
    }

    handleVideoEnded = () => {
        if(this.state.currSegment < this.props.media.segment_urls.length - 1) {
            this.setState({
                currSegment: this.state.currSegment + 1
            })
        } else {   
            this.props.onEnd({ success: true })
        }
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
        let video_url = this.props.media.url
        if(this.state.currSegment != -1) {
            video_url = this.props.media.segment_urls[this.state.currSegment]
        }

        return <>
            <Row>
                <Col span={20}>
                    <HTML5Player
                        url={video_url}
                        paused={this.state.paused}
                        pausePlay={this.handlePausePlay}
                        ref={this.player}
                        onEnded={this.handleVideoEnded}
                        onLoad={this.handleVideoLoad}
                        controls={true}>
                    </HTML5Player>
                </Col>
                <Col span={4}>
                </Col>
            </Row>
        </>
    }

    instructions = () => {
        return <>
            <Row>
                <Col span={24}>
                    <Title level={4}>Keyboard controls</Title>
                    {/* {this.context.renderInfo()} */}
                </Col>
            </Row>
        </>
    }
}
VideoRecallTask.contextType = keyboardManagerContext
export default VideoRecallTask