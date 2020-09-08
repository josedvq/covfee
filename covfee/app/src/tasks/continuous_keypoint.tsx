import React from 'react'
import {
    Row,
    Col,
    Space,
    Divider,
    Button
} from 'antd';
import OpencvFlowPlayer from '../players/opencv'
import '../css/gui.css'
import MouseTracker from '../input/mouse_tracker'
import { EventBuffer } from '../buffer'
import { Form } from '../form'
import Task from './task'

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

class ContinuousKeypointAnnotationTask extends React.Component {
    private state = {
        'paused': true,
        'mouse': {
            'xy': { t: 'm', x: 0, y: 0 }, // mouse position
            'valid': false
        }, 
        'url': this.props.url
    }
    private player = React.createRef()
    private tracker = React.createRef()
    private buffer = new EventBuffer(
        200,
        this.props.url + '/chunk',
        this.handle_chunk_error.bind(this)
    )
    private on_keydown: object;

    componentDidMount() {
        // key bindings
        this.on_keydown = (function (e) {
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
                    this.toggle_play_pause()
                    break
                case 'x': // => go back 2s
                    var t1 = Math.max(0, this.player.current.currentTime() - 2)
                    this.player.current.currentTime(t1)
                    // this.player.current.play()
                    break
                case 'f':
                    console.log('fullscreen')
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
        }).bind(this)

        document.addEventListener("keydown", this.on_keydown, false);
    }

    componentWillUnmount() {
        document.removeEventListener("keydown", this.on_keydown, false);
    }

    mouse_data(data: any) {
        this.setState({ 'mouse': {'xy': data }})
        this.buffer.data(
            this.player.current.currentTime(),
            data
        )
    }

    mouse_active_change(status: boolean){
        this.setState({ 'mouse': { 'valid': status } })
    }

    handle_chunk_error() {
        console.log('error submitting buffer!')
    }

    toggle_play_pause() {
        if (this.state.paused) {
            this.tracker.current.start()
            this.player.current.play()
            this.setState({ paused: false })
        } else {
            this.tracker.current.stop()
            this.player.current.pause()
            this.setState({ paused: true })
        }
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
        return <Task validate={this.validate.bind(this)}>
            <Row gutter={16}>
                <Col span={16}>
                    <MouseTracker onData={this.mouse_data.bind(this)} onMouseActiveChange={this.mouse_active_change.bind(this)} ref={this.tracker}>
                        <OpencvFlowPlayer
                            {...playerOptions}
                            mouse_xy={this.state.mouse_xy}
                            ref={this.player}>
                        </OpencvFlowPlayer>
                    </MouseTracker>
                </Col>
                <Col span={8}>
                    <Task.Submit>Submit</Task.Submit>
                </Col>
            </Row>
        </Task>
    }
}

export default ContinuousKeypointAnnotationTask