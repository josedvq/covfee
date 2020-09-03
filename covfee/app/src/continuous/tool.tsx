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

function getFullscreen(element) {
    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
    }
}

function closeFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.mozCancelFullScreen) { /* Firefox */
        document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { /* IE/Edge */
        document.msExitFullscreen();
    }
}

class ContinuousKeypointAnnotationTool extends React.Component {
    private state = {
        'paused': true,
        'mouse': {
            'xy': { t: 'm', x: 0, y: 0 }, // mouse position
            'valid': false
        },
        'url': this.props.url,
        'overlay': false
    }
    private player = React.createRef()
    private tracker = React.createRef()
    private buffer = new EventBuffer(
        1000,
        this.props.url + '/chunk',
        this.handleChunkError.bind(this)
    )
    private boundOnKeyDown: Function;

    onKeydown (e: Event) {
        switch (e.key) {
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
                this.player.current.playbackRate(1 / parseFloat(e.key))
                break
            case ' ':
                this.togglePlayPause()
                break
            case 'x': // => go back 2s
                var t1 = Math.max(0, this.player.current.currentTime() - 2)
                this.player.current.currentTime(t1)
                break
            case 'f':
                getFullscreen(this.tracker.current.getContainer())
                break
            case 'z': // => slow down
                let t2 = Math.max(0, this.player.current.currentTime() - 10)
                this.player.current.currentTime(t2)
                // this.player.current.play()
                break
            default:
                break
        }
    }

    public startKeyboardListen() {
        document.addEventListener("keydown", this.boundOnKeyDown, false)
    }

    public stopKeyboardListen() {
        document.removeEventListener("keydown", this.boundOnKeyDown, false)
    }

    componentDidMount() {
        this.boundOnKeyDown = this.onKeydown.bind(this)
        this.startKeyboardListen()
    }

    componentWillUnmount() {
        this.stopKeyboardListen()
    }

    handleMouseData(data: any) {
        this.setState({ 'mouse': { 'xy': data } })
        this.buffer.data(
            this.player.current.currentTime(),
            data
        )
    }

    handleMouseActiveChange(status: boolean) {
        this.setState({ 'mouse': { 'valid': status } })
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
        return <MouseTracker 
                    paused={this.state.paused}
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
                    mouse={this.state.mouse}
                    ref={this.player}
                    onEnded={this.handleVideoEnded.bind(this)}>
                </OpencvFlowPlayer>
            </MouseTracker>
    }
}

export default ContinuousKeypointAnnotationTool