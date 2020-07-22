import React from 'react';
import VideoPlayer from './player';
import { JoystickGUI } from './annotation_gui/joystick';
import './annotation_gui/gui.css'
import MouseTracker from './annotation_gui/mouse_tracker'
import {EventBuffer} from './buffer'
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import Constants from '../constants'

class ChunkAnnotationTask extends React.Component {
    state: any
    player: any

    constructor(props: any) {
        super(props);
        this.state = {
            url: props.url
        }
    }

    componentDidMount() {
        
    }

    render() {
        const videoJsOptions = {
            autoplay: true,
            controls: true,
            fluid: true,
            aspectRatio: '16:9',
            sources: [{
                src: this.state.url,
                type: 'video/mp4'
            }]
        };
        return <VideoPlayer {...videoJsOptions}></VideoPlayer>

    }
}

class ContinuousPointAnnotationTask extends React.Component {
    private state = {
        'paused': true,
        'url': this.props.url
    }
    private player = React.createRef()
    private tracker= React.createRef()
    private buffer = new EventBuffer(
        1000,
        this.props.submit_url
    )
    private on_space: object;

    componentDidMount() {
        this.on_space = (function (e) {
            if (e.keyCode == 32) {
                this.player.current.toggle_play_pause()
            }
        }).bind(this)

        document.addEventListener("keydown", this.on_space, false);
    }

    componentWillUnmount() {
        document.removeEventListener("keydown", this.on_space, false);
    }

    data(data: any) {
        this.buffer.data(
            this.player.current.time(),
            data
        )
    }

    pause(e) {
        this.tracker.current.stop()
    }
    
    play(e) {
        this.tracker.current.start()
    }

    render() {
        const videoJsOptions = {
            autoplay: false,
            controls: false,
            fluid: true,
            aspectRatio: '16:9',
            sources: [{
                src: this.state.url,
                type: 'video/mp4'
            }]
        };
        return <MouseTracker on_data={this.data.bind(this)} ref={this.tracker}>
            <VideoPlayer
            {...videoJsOptions} 
            on_pause={this.pause.bind(this)} 
            on_play={this.play.bind(this)} 
            ref={this.player}>
            </VideoPlayer>
        </MouseTracker>
    }
}

class ContinuousAnnotationTask extends React.Component {
    state: any
    player: any

    constructor(props: any) {
        super(props);
        this.state = {
            url: props.url
        }
    }

    componentDidMount() {
        
    }

    render() {
        return <h1>Continuous annotation</h1>
    }
}

export { ChunkAnnotationTask, ContinuousPointAnnotationTask, ContinuousAnnotationTask }