import * as React from 'react'
import { MediaSpec } from '../tasks/task'

// video player using opencv to control playback speed
interface Props extends MediaSpec{
    /**
     * Indicates if the video is paused or playing
     */
    paused: boolean,
    onLoad: Function,
    onFrame: Function,
    onEnded: Function,
    pausePlay: Function
}

class HTML5Player extends React.PureComponent<Props> {
    private video_tag = React.createRef<HTMLVideoElement>()

    private req_id: any = false
    private frame: number = 0
    private time: number = 0

    componentDidMount() {

        this.video_tag.current.addEventListener('loadedmetadata', (e: Event) => {
            this.props.onLoad(this.video_tag.current)
        })

        this.video_tag.current.addEventListener('ended', (e: Event) => {
            this.props.onEnded(e)
            this.pause()
        })
    }

    componentDidUpdate(prevProps: Props) {
        // Typical usage (don't forget to compare props):
        if (this.props.paused !== prevProps.paused) {
            if(this.props.paused) this.pause()
            else this.play()
        }
    }

    processVideo = () => {
        const time = this.video_tag.current.currentTime
        if(time !== this.time) {
            this.time = time
            this.frame = Math.round(time / this.props.fps)
            this.props.onFrame(this.frame)
        }
        this.req_id = window.requestAnimationFrame(this.processVideo)
    }

    public play() {
        this.req_id = window.requestAnimationFrame(this.processVideo)
        this.video_tag.current.play()
    }

    public pause() {
        window.cancelAnimationFrame(this.req_id)
        this.req_id = false
        this.video_tag.current.pause()
    }

    public restart() {
        this.currentTime(0)
    }

    public currentTime(t?: number) {
        if(t !== undefined) {
            this.video_tag.current.currentTime = t
            this.frame = Math.round(t * this.props.fps)
            this.props.pausePlay(true) // pause the video
        }
        else return this.video_tag.current.currentTime
    }

    public currentFrame(t?: number) {
        if (t !== undefined) {
            this.currentTime(t / this.props.fps)
        }
        else return this.frame
    }

    // wrap the player in a div with a `data-vjs-player` attribute
    // so videojs won't create additional wrapper in the DOM
    // see https://github.com/videojs/video.js/pull/3856

    // use `ref` to give Video JS a reference to the video DOM element: https://reactjs.org/docs/refs-and-the-dom
    //style={{ display: 'none' }}
    render() {
        return <>
            <video ref={this.video_tag} width="100%" crossOrigin="Anonymous" preload="auto" muted> 
                <source src={this.props.url} type={"video/mp4"}></source>
            </video>
        </>
    }
}

export default HTML5Player