import React from 'react'
import {
    Row,
    Col,
    Space,
    Divider,
    Button
} from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import OpencvFlowPlayer from '../players/opencv'
import '../css/gui.css'
import MouseTracker from '../input/mouse_tracker'
import { EventBuffer } from '../buffer'
import 'video.js/dist/video-js.css'
import Constants from '../constants'
import { Form } from '../form'
import classNames from 'classnames'

class ContinuousKeypointAnnotationTool extends React.Component {
    private state = {
        paused: true,
        occluded: false,
        mouse: {
            // 'xy': { t: 'm', x: 0, y: 0 }, // mouse position
            valid: false
        },
        url: this.props.url,
        overlay: false,
        playbackRateIdx: 6
    }
    private playbackRates = [1/8, 1/7, 1/6, 1/5, 1/4, 1/3, 1/2, 1, 2, 3, 4]
    private player = React.createRef()
    private tracker = React.createRef()
    private buffer = new EventBuffer(
        1000,
        this.props.url + '/chunk',
        this.handleChunkError.bind(this)
    )

    onKeydown (e: Event) {
        switch (e.key) {
            case 'ArrowRight':
                this.setState({ playbackRateIdx: Math.min(this.state.playbackRateIdx+1, this.playbackRates.length-1) })
                break
            case 'ArrowLeft':
                this.setState({ playbackRateIdx: Math.max(this.state.playbackRateIdx-1, 0) })
                break
            case ' ':
                this.togglePlayPause()
                break
            case 'x': // => go back 2s
                var t1 = Math.max(0, this.player.current.currentTime() - 2)
                this.player.current.currentTime(t1)
                break
            case 'c': // => go back 10s
                let t2 = Math.max(0, this.player.current.currentTime() - 10)
                this.player.current.currentTime(t2)
                break
            case 'z': // occluded
                this.setState({occluded: true})
            default:
                break
        }
    }

    public startKeyboardListen() {
        document.addEventListener("keydown", this.onKeydown, false)
    }

    public stopKeyboardListen() {
        document.removeEventListener("keydown", this.onKeydown, false)
    }

    componentDidMount() {
        this.onKeydown = this.onKeydown.bind(this)
        this.startKeyboardListen()
    }

    componentWillUnmount() {
        this.stopKeyboardListen()
    }

    handleMouseData(data: any) {
        console.log([data.x, data.y])
        this.buffer.data(
            this.player.current.currentTime(),
            data
        )
    }

    handleMouseActiveChange(status: boolean) {
        this.setState({ mouse: { valid: status } }, ()=>{
        })
    }

    handleChunkError() {
        console.log('error submitting buffer!')
    }

    handleVideoEnded() {
        this.setState({
            overlay: true,
            paused: true
        })
    }

    handleSubmit() {
        this.props.onSubmit()
    }

    handleRedo() {
        this.setState({
            overlay: false
        }, ()=>{
            this.player.current.restart()
        })
        
    }

    togglePlayPause() {
        this.setState({paused: !this.state.paused})
    }

    handlePausePlay(pause: boolean) {
        this.setState({
            paused: pause
        })
    }

    validate() {
        return true
    }

    render() {
        const playerOptions = {
            muted: true,
            autoplay: false,
            controls: false,
            fluid: true,
            aspectRatio: '16:9',
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
                <div className="annot-bar-section">speed: {pr_str}x</div>
            </div>
            <MouseTracker 
                paused={this.state.paused}
                mouseActive={this.state.mouse.valid}
                onData={this.handleMouseData.bind(this)} 
                onMouseActiveChange={this.handleMouseActiveChange.bind(this)} 
                ref={this.tracker}>
                <div className={classNames('video-overlay', { 'overlay-off': !this.state.overlay})}>
                    <div className="video-overlay-nav">
                        <Button onClick={this.handleRedo.bind(this)}>Re-do</Button>
                        <Button onClick={this.handleSubmit.bind(this)} type="primary">Submit</Button>
                    </div>
                </div>
                <OpencvFlowPlayer
                    {...playerOptions}
                    paused={this.state.paused}
                    pausePlay={this.handlePausePlay.bind(this)}
                    rate={this.playbackRates[this.state.playbackRateIdx]}
                    mouse={this.state.mouse}
                    ref={this.player}
                    onEnded={this.handleVideoEnded.bind(this)}>
                </OpencvFlowPlayer>
            </MouseTracker>
        </>
    }
}

export default ContinuousKeypointAnnotationTool