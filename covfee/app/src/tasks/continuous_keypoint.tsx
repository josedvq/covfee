import * as React from 'react'
import {
    Button,
    Modal
} from 'antd';
import { ReloadOutlined, CaretRightOutlined, ClockCircleOutlined } from '@ant-design/icons';
import OpencvFlowPlayer from 'Players/opencv'
import '../css/gui.css'
import MouseTracker from 'Input/mouse_tracker'
import { EventBuffer } from '../buffer'
import classNames from 'classnames'

interface Props {
    taskName: string,
    numSubmissions: number,
    url: string
    media: object,
    onSubmit: Function
}
interface State {
    paused: boolean,
    occluded: boolean,
    mouse_valid: boolean,
    playbackRateIdx: number,
    duration: number,
    currentTime: number,
    currentFrame: number,
    overlay: {
        visible: boolean,
        submitted: boolean,
        submitting: boolean
    },
    errorModal: {
        visible: boolean,
        message: string,
        loading: boolean
    },
    reverseCount: {
        visible: boolean,
        count: number
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
        overlay: {
            visible: false,
            submitted: false,
            submitting: false,
        },
        errorModal: {
            visible: false,
            message: '',
            loading: false
        },
        reverseCount: {
            visible: false,
            count: 0
        }
    }
    private playbackRates = [1/8, 1/7, 1/6, 1/5, 1/4, 1/3, 1/2, 1, 2, 3, 4]
    private player = React.createRef<OpencvFlowPlayer>()
    private tracker = React.createRef<MouseTracker>()
    private buffer: EventBuffer
    private mouse = [0,0]
    private mouse_normalized = [0,0]
    private reverseCountTimerId: number = null

    componentDidMount() {
        this.startKeyboardListen()

        this.setState({
            overlay: { 
                ...this.state.overlay, 
                visible: (this.props.numSubmissions > 0), 
                submitted: (this.props.numSubmissions > 0)
            }
        })

        this.buffer = new EventBuffer(
            2000,
            this.props.url + '/chunk',
            this.props.numSubmissions,
            this.handleBufferError
        )
    }

    componentWillUnmount() {
        this.stopKeyboardListen()
    }

    handleKeydown = (e: KeyboardEvent) => {
        if (e.repeat) {
            e.preventDefault()
            e.stopPropagation()
            return 
        }
        switch (e.key) {
            case 'ArrowRight':
                this.setState({ playbackRateIdx: Math.min(this.state.playbackRateIdx+1, this.playbackRates.length-1) })
                this.buffer.data(this.player.current.currentFrame(), ['speedup', this.playbackRates[this.state.playbackRateIdx]])
                break
            case 'ArrowLeft':
                this.setState({ playbackRateIdx: Math.max(this.state.playbackRateIdx-1, 0) })
                this.buffer.data(this.player.current.currentFrame(), ['speeddown', this.playbackRates[this.state.playbackRateIdx]])
                break
            case ' ':
                e.preventDefault()
                if (this.state.paused) this.buffer.data(this.player.current.currentFrame(), ['play'])
                else this.buffer.data(this.player.current.currentFrame(), ['pause'])
                this.togglePlayPause()
                break
            case 'x': // => go back 2s
                const t1 = Math.max(0, this.player.current.currentTime() - 2)
                this.goto(t1)
                this.buffer.data(this.player.current.currentFrame(), ['back2s'])
                break
            case 'c': // => go back 10s
                const t2 = Math.max(0, this.player.current.currentTime() - 10)
                this.goto(t2)
                this.buffer.data(this.player.current.currentFrame(), ['back10s'])
                break
            case 'z': // occluded
                this.toggleOcclusion()
                break
            default:
                break
        }
    }

    private toggleOcclusion = () => {
        this.setState({ occluded: !this.state.occluded }, ()=>{})
        
    }

    private startReverseCount = () => {
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
                this.handlePausePlay(false, () => { })
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

    private cancelReverseCount = (cb?: Function) => {
        if(this.reverseCountTimerId != null) {
            window.clearInterval(this.reverseCountTimerId)
            this.reverseCountTimerId = null
        }
        this.setState({
            reverseCount: {
                ...this.state.reverseCount,
                visible: false,
            }
        }, ()=>{if(cb) cb()})
    }

    private goto = (time: number) => {
        this.player.current.currentTime(time)
        this.cancelReverseCount(this.startReverseCount)
    }

    handleKeyUp = (e: KeyboardEvent) => {
        switch (e.key) {
            case 'z':
                this.setState({ occluded: false })
                break
        }
    }

    public startKeyboardListen = () => {
        document.addEventListener("keydown", this.handleKeydown, false)
    }

    public stopKeyboardListen = () => {
        document.removeEventListener("keydown", this.handleKeydown, false)
    }

    handleMouseData = (data: any, e: MouseEvent) => {
        this.mouse = [e.offsetX, e.offsetY]
        this.mouse_normalized = data
    }

    getMousePosition = () => {
        return this.mouse
    }

    handleMouseActiveChange = (status: boolean) => {
        this.setState({ mouse_valid: status }, ()=>{
        })
    }

    handleVideoLoad = (vid) => {
        this.setState({
            duration: vid.duration
        })
    }

    handleFrame = (frame: number) => {
        this.buffer.data(
            frame,
            [...this.mouse_normalized, this.state.mouse_valid ? 1 : 0, this.state.occluded ? 1 : 0]
        )
    }

    handleVideoEnded = () => {
        this.setState({
            overlay: {
                visible: true,
                submitted: false,
                submitting: false
            },
            paused: true
        })
    }

    handleSubmit = () => {
        this.setState({ overlay: {
            ...this.state.overlay, 
            submitting: true 
        }})

        this.buffer.attemptBufferSubmit(true)

        this.buffer.awaitQueueClear(3000).then(()=>{
            const url = this.props.url + '/submit'
            const requestOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 'sucess': true })
            }

            return fetch(url, requestOptions)
                .then(async response => {
                    const data = await response.json()

                    // check for error response
                    if (!response.ok) {
                        // get error message from body or default to response status
                        const error = (data && data.message) || response.status
                    }

                    this.props.onSubmit(data)
                    this.setState({ overlay: {
                        ...this.state.overlay,
                        submitting: false,
                        submitted: true
                    }})
                })
                .catch(error => {
                    return Promise.reject(error)
                })
        }).catch((error)=>{
            this.setState({
                overlay: {
                    ...this.state.overlay,
                    submitting: false
                }
            })
            console.error('There was an error submitting the task!', error)
        })
    }

    handleRedo = () => {
        this.setState({
            overlay: {
                ...this.state.overlay,
                visible: false
            }
        }, ()=>{
            this.player.current.restart()
        })
        
    }

    togglePlayPause = () => {
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

    handlePausePlay = (pause: boolean, cb?:Function) => {
        this.setState({
            paused: pause,
            currentTime: this.player.current.currentTime(),
            currentFrame: this.player.current.currentFrame()
        }, ()=>{if(cb) cb()})
    }

    validate = () => {
        return true
    }

    handleBufferError = (msg: string) => {
        this.handlePausePlay(true)
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

        this.buffer.attemptBufferSubmit()
        this.buffer.awaitQueueClear(5000).then(() => {
            this.setState({ errorModal: { ...this.state.errorModal, visible: false, loading: false } })
        }).catch(()=>{
            this.setState({ errorModal: {
                visible: true,
                message: modalMessage + ' Unable to send the data. Please communicate with the organizers if the problems persist.', 
                loading: false } })
        })
    }

    handleErrorCancel = () => {
        this.setState({ errorModal: {
            ...this.state.errorModal,
             visible: false } })
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
                <div className="annot-bar-header">{this.props.taskName}</div>
                <div className="annot-bar-section"><CaretRightOutlined /> {pr_str}x</div>
                {this.state.paused ? <div className="annot-bar-section"><ClockCircleOutlined /> {this.state.currentTime.toFixed(1)} / {this.state.duration.toFixed(1)}</div> : <></>}
                {this.state.paused ? <div className="annot-bar-section">frame {this.state.currentFrame}</div> : <></>}
                {this.state.reverseCount.visible ? <div className="annot-bar-section" style={{'color': 'red'}}>{this.state.reverseCount.count}</div> : <></>}
            </div>
            <MouseTracker 
                paused={this.state.paused}
                occluded={this.state.occluded}
                mouseActive={this.state.mouse_valid}
                onData={this.handleMouseData} 
                onMouseActiveChange={this.handleMouseActiveChange} 
                ref={this.tracker}>
                <div className={classNames('video-overlay', { 'overlay-off': !this.state.overlay.visible})}>
                    <div className="video-overlay-nav">
                        <Button onClick={this.handleRedo}>Re-do</Button>
                        <Button onClick={this.handleSubmit} type="primary" disabled={this.state.overlay.submitted} loading={this.state.overlay.submitting}>Submit</Button>
                    </div>
                </div>
                <OpencvFlowPlayer
                    {...playerOptions}
                    paused={this.state.paused}
                    pausePlay={this.handlePausePlay}
                    rate={this.playbackRates[this.state.playbackRateIdx]}
                    getMousePosition={this.getMousePosition}
                    // mouse={this.state.mouse}
                    ref={this.player}
                    onEnded={this.handleVideoEnded}
                    onLoad={this.handleVideoLoad}
                    onFrame={this.handleFrame}>
                </OpencvFlowPlayer>
            </MouseTracker>
            <Modal
                title="Error"
                visible={this.state.errorModal.visible}
                confirmLoading={this.state.errorModal.loading}
                onOk={this.handleErrorOk}
                onCancel={this.handleErrorCancel}
                cancelButtonProps={{ disabled: true }}
                okButtonProps={{}}
            >
                <p>{this.state.errorModal.message}</p>
            </Modal>
        </>
    }
}

export default ContinuousKeypointTask