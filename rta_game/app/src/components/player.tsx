import React from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import cv from 'cv';

abstract class Player extends React.Component {
    public instructions = this.props.instructions
    public submit_url = this.props.submit_url

    constructor(props: any) {
        super(props);
    }

    abstract toggle_play_pause(): void

    // return player's current time in seconds
    abstract time(): number
}

// video player using opencv to control playback speed
class OpencvFlowPlayer extends Player {
    private player: any
    private video_tag = React.createRef()
    private flow_tag = React.createRef()
    private cap: any
    private frame_flow: cv.Mat
    private myMean: cv.Mat
    private myStddev: cv.Mat

    private req_id: any = false
    private rect: object
    private ratio: number = 0.5
    private delay: number = 0
    private multiplier: number = 0.5

    constructor(props: any) {
        super(props);
    }

    componentDidMount() {

        function cv_init() {
            console.log('initialized')
            this.frame_flow = new cv.Mat(this.props.flow.res[1], this.props.flow.res[0], cv.CV_8UC4)
            this.myMean = new cv.Mat(1, 4, cv.CV_64F)
            this.myStddev = new cv.Mat(1, 4, cv.CV_64F)
            this.cap = new cv.VideoCapture(this.flow_tag.current)
        }

        // check if cv is already runtime-ready
        if (cv.Mat == undefined) {
            cv['onRuntimeInitialized'] = cv_init.bind(this)
        } else {
            cv_init.bind(this)()
        }
        
        var observer = new ResizeObserver(function(entries) {
            this.rect = entries[0].contentRect
            this.ratio = this.props.flow.res[0] / this.rect.width
            console.log(this.ratio)
        }.bind(this))
        observer.observe(this.video_tag.current)
    }

    shouldComponentUpdate(nextProps, nextState) {
        return false
    }

    private processVideo() {
        // start processing.
        this.cap.read(this.frame_flow)
        const x1 = Math.max(0, this.props.mouse_xy.x * this.ratio - 10)
        const x2 = Math.min(this.props.mouse_xy.x * this.ratio + 10, this.props.flow.res[0])
        const y1 = Math.max(0, this.props.mouse_xy.y * this.ratio - 10)
        const y2 = Math.min(this.props.mouse_xy.y * this.ratio + 10, this.props.flow.res[1])

        const rect = new cv.Rect(x1, y1, x2-x1, y2-y1)
        const roi = this.frame_flow.roi(rect)
        cv.meanStdDev(roi, this.myMean, this.myStddev)
        this.delay = this.myMean.doubleAt(0, 0)
        this.flow_tag.current.seekToNextFrame()
        this.video_tag.current.seekToNextFrame()
    }

    public play() {
        this.video_tag.current.onseeked = () => {
            setTimeout(() => {
                this.req_id = window.requestAnimationFrame(this.processVideo.bind(this))
            }, Math.round(this.delay*this.multiplier))
        }
        this.req_id = window.requestAnimationFrame(this.processVideo.bind(this))
    }

    public pause() {
        window.cancelAnimationFrame(this.req_id)
        this.req_id = false
        this.video_tag.current.onseeked = undefined
    }

    public toggle_play_pause() {
        if(this.req_id)
            this.pause()
        else
            this.play()
    }

    public currentTime() {
        return this.video_tag.current.currentTime
    }
    
    // wrap the player in a div with a `data-vjs-player` attribute
    // so videojs won't create additional wrapper in the DOM
    // see https://github.com/videojs/video.js/pull/3856

    // use `ref` to give Video JS a reference to the video DOM element: https://reactjs.org/docs/refs-and-the-dom
    //style={{ display: 'none' }}
    render() {
        console.log('render')
        return <>
                <video ref={this.video_tag} width="100%" crossorigin="Anonymous" autobuffer preload muted> 
                    <source src={this.props.video.src} type={"video/mp4"}></source>
                </video>
                <video ref={this.flow_tag} width={this.props.flow.res[0]} height={this.props.flow.res[1]} crossorigin="Anonymous" style={{ display: 'none' }} autobuffer preload muted>
                    <source src={this.props.flow.src} type={"video/mp4"}></source>
                </video>
            </>
    }
}

// video.js player from the docs: https://github.com/videojs/video.js/blob/master/docs/guides/react.md
class VideojsPlayer extends Player {
    private player: any;

    componentDidMount() {
        // instantiate Video.js
        this.player = videojs(this.videoNode, this.props, function onPlayerReady() {
            console.log('onPlayerReady', this)
            this.play()
        });

        if(this.props.on_play) {
            this.player.on('play', (function(e){
                this.props.on_play(e)
            }).bind(this))
        }

        if(this.props.on_pause) {
            this.player.on('pause', (function (e) {
                this.props.on_pause(e)
            }).bind(this))
        }
    }

    public play() {
        this.player.play()
    }

    public playbackRate(rate: number) {
        this.player.playbackRate(rate)
    }

    public toggle_play_pause() {
        if (this.player.paused()) {
            this.player.play()
        } else {
            this.player.pause()
        }
    }

    public currentTime(t: number) {
        return this.player.currentTime(t)
    }

    // destroy player on unmount
    componentWillUnmount() {
        if (this.player) {
            this.player.dispose()
        }
    }

    componentWillReceiveProps(newProps) {
        // When a user moves from one title to the next, the VideoPlayer component will not be unmounted,
        // instead its properties will be updated with the details of the new video. In this case,
        // we can update the src of the existing player with the new video URL.
        if (this.player) {
            this.player.src(newProps.sources[0])
        }
    }

    // wrap the player in a div with a `data-vjs-player` attribute
    // so videojs won't create additional wrapper in the DOM
    // see https://github.com/videojs/video.js/pull/3856

    // use `ref` to give Video JS a reference to the video DOM element: https://reactjs.org/docs/refs-and-the-dom
    render() {
        return (
            <div data-vjs-player>
                <video ref={node => this.videoNode = node} className="video-js"></video>
            </div>
        )
    }
}

class MpegDashPlayer extends Player {
    private player: any;

    componentDidMount() {
        
    }

    public toggle_play_pause() {
        
    }

    public time() {
    }

    // destroy player on unmount
    componentWillUnmount() {
        
    }

    componentWillReceiveProps(newProps) {
        
    }

    render() {
        
    }
}

export { OpencvFlowPlayer, VideojsPlayer, MpegDashPlayer };