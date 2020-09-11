import React from 'react'
import {
    Row,
    Col,
    Space,
    Divider,
    Button,
    Modal
} from 'antd';
import { ReloadOutlined, CaretRightOutlined, ClockCircleOutlined } from '@ant-design/icons';
import OpencvFlowPlayer from '../players/opencv'
import '../css/gui.css'
import MouseTracker from '../input/mouse_tracker'
import { EventBuffer } from '../buffer'
import { Form } from '../form'
import classNames from 'classnames'

class ContinuousKeypointAnnotationTool extends React.Component {
    private state = {
        paused: true,
        occluded: false,
        mouse_valid: false,
        mouse: [0,0],
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
        }
    }
    private playbackRates = [1/8, 1/7, 1/6, 1/5, 1/4, 1/3, 1/2, 1, 2, 3, 4]
    private player = React.createRef()
    private tracker = React.createRef()
    private buffer: EventBuffer

    componentDidMount() {
        this.onKeydown = this.onKeydown.bind(this)
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
            this.handleBufferError.bind(this)
        )
    }

    componentWillUnmount() {
        this.stopKeyboardListen()
    }

    onKeydown (e: Event) {
        if (e.repeat) {
            e.preventDefault()
            e.stopPropagation()
            return 
        }
        switch (e.key) {
            case 'ArrowRight':
                this.setState({ playbackRateIdx: Math.min(this.state.playbackRateIdx+1, this.playbackRates.length-1) })
                this.buffer.data(this.player.current.currentTime(), ['speedup', this.playbackRates[this.state.playbackRateIdx]])
                break
            case 'ArrowLeft':
                this.setState({ playbackRateIdx: Math.max(this.state.playbackRateIdx-1, 0) })
                this.buffer.data(this.player.current.currentTime(), ['speeddown', this.playbackRates[this.state.playbackRateIdx]])
                break
            case ' ':
                e.preventDefault()
                if (this.state.paused) this.buffer.data(this.player.current.currentTime(), ['play'])
                else this.buffer.data(this.player.current.currentTime(), ['pause'])
                this.togglePlayPause()
                break
            case 'x': // => go back 2s
                var t1 = Math.max(0, this.player.current.currentTime() - 2)
                this.player.current.currentTime(t1)
                this.buffer.data(this.player.current.currentTime(), ['back2s'])
                break
            case 'c': // => go back 10s
                let t2 = Math.max(0, this.player.current.currentTime() - 10)
                this.player.current.currentTime(t2)
                this.buffer.data(this.player.current.currentTime(), ['back10s'])
                break
            case 'z': // occluded
                this.toggleOcclusion()
                break
            default:
                break
        }
    }

    private toggleOcclusion() {
        this.setState({ occluded: !this.state.occluded }, ()=>{})
        
    }

    onKeyUp(e: Event) {
        switch (e.key) {
            case 'z':
                this.setState({ occluded: false })
                break
        }
    }

    public startKeyboardListen() {
        document.addEventListener("keydown", this.onKeydown, false)
        // document.addEventListener("keyup", this.onKeyUp, false)
    }

    public stopKeyboardListen() {
        document.removeEventListener("keydown", this.onKeydown, false)
        // document.removeEventListener("keyup", this.onKeyUp, false)
    }

    handleMouseData(data: any, e: Event) {
        const frame = this.player.current.currentFrame()
        this.buffer.data(
            frame,
            [data[0], data[1], this.state.occluded]
        )
        this.setState({ mouse: [e.offsetX, e.offsetY]})
    }

    handleMouseActiveChange(status: boolean) {
        this.setState({ mouse_valid: status }, ()=>{
        })
    }

    handleVideoLoad = (vid) => {
        this.setState({
            duration: vid.duration
        })
    }

    handleVideoEnded() {
        this.setState({
            overlay: {
                visible: true,
                submitted: false,
                submitting: false
            },
            paused: true
        })
    }

    handleSubmit() {
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
                    console.log(data)

                    this.props.onSubmit(data)
                    this.setState({ overlay: {
                        ...this.state.overlay,
                        submitting: false,
                        submitted: true
                    }})
                })
                .catch(error => {
                    return Promise.reject(error)
                    // this.setState({ error: error.toString(), submitting: false })
                })
        }).catch((error)=>{
            this.setState({
                overlay: {
                    ...this.state.overlay,
                    submitting: false,
                    error: 'There was an error submitting the task. Please try again, or contact the admin if the problem persists.'
                }
            })
            console.error('There was an error submitting the task!', error)
            // console.error('There was an error flushing the queue!', error)
        })
    }

    handleRedo() {
        this.setState({
            overlay: {
                ...this.state.overlay,
                visible: false
            }
        }, ()=>{
            this.player.current.restart()
        })
        
    }

    togglePlayPause() {
        this.handlePausePlay(!this.state.paused)
    }

    handlePausePlay(pause: boolean) {
        this.setState({
            paused: pause,
            currentTime: this.player.current.currentTime(),
            currentFrame: this.player.current.currentFrame()
        })
    }

    validate() {
        return true
    }

    handleBufferError(msg: string) {
        this.handlePausePlay(true)
        this.setState({
            errorModal: {
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
            this.setState({ errorModal: { visible: false, loading: false } })
        }).catch(()=>{
            this.setState({ errorModal: {
                visible: true,
                message: modalMessage + ' Unable to send the data. Please communicate with the organizers if the problems persist.', 
                loading: false } })
        })
    }

    handleErrorCancel = () => {
        this.setState({ errorModal: { visible: false } })
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
            </div>
            <MouseTracker 
                paused={this.state.paused}
                occluded={this.state.occluded}
                mouseActive={this.state.mouse_valid}
                onData={this.handleMouseData.bind(this)} 
                onMouseActiveChange={this.handleMouseActiveChange.bind(this)} 
                ref={this.tracker}>
                <div className={classNames('video-overlay', { 'overlay-off': !this.state.overlay.visible})}>
                    <div className="video-overlay-nav">
                        <Button onClick={this.handleRedo.bind(this)}>Re-do</Button>
                        <Button onClick={this.handleSubmit.bind(this)} type="primary" disabled={this.state.overlay.submitted} loading={this.state.overlay.submitting}>Submit</Button>
                    </div>
                </div>
                <OpencvFlowPlayer
                    {...playerOptions}
                    paused={this.state.paused}
                    pausePlay={this.handlePausePlay.bind(this)}
                    rate={this.playbackRates[this.state.playbackRateIdx]}
                    mouse={this.state.mouse}
                    ref={this.player}
                    onEnded={this.handleVideoEnded.bind(this)}
                    onLoad={this.handleVideoLoad}>
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

export default ContinuousKeypointAnnotationTool