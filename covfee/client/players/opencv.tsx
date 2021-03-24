/* global cv */
import * as React from 'react'
import { OpencvFlowPlayerMedia } from '@covfee-types/players/opencv';
import { myinfo } from '../utils'

// video player using opencv to control playback speed
interface Props extends OpencvFlowPlayerMedia {
    /**
     * If true, the player will pause. The parent element can play/pause playback through changing this prop.
     */
    paused: boolean,
    /**
     * If true, automatic optical-flow-based speed adjustment is enabled
     */
    opticalFlowEnabled?: boolean,
    /**
     * Controls the `paused` state variable. setPaused(val) will set `paused` to val, either true or false, to pause or play the video.
     */
    setPaused: Function,
    /**
     * Playback rate.
     */
    rate: number,
    /**
     * Returns the mouse position, used to adjust the video playback speed.
     */
    getMousePosition: Function,
    /**
     * This method is called when the video metadata has loaded (`loadedmetadata`).
     */
    onLoad?: Function,
    /**
     * Called when there is an error pre-loading the video
     */
    onError?: Function,
    /**
     * This method is called for every frame. It can be used to capture a signal from the user for every frame of the video. Some frames may be skipped if performance is suffering.
     */
    onFrame?: Function,
    /**
     * Called when the video has finished playing.
     */
    onEnded?: Function,
}
class OpencvFlowPlayer extends React.PureComponent<Props> {
    private video_tag = React.createRef<HTMLVideoElement>()
    private flow_tag = React.createRef<HTMLVideoElement>()
    private cap: cv.VideoCapture
    private frame_flow: cv.Mat
    private myMean: cv.Mat
    private myStddev: cv.Mat

    private req_id: any = false
    private timeout_id: any = false
    private rect: DOMRectReadOnly
    private ratio: number = 0.5
    private delay: number = 0
    private frame: number = 0

    state = {
        ready: false
    }

    static defaultProps = {
        opticalFlowEnabled: true
    }

    componentDidMount() {

        const cv_init = () => {
            this.frame_flow = new cv.Mat(this.props.flow_res[1], this.props.flow_res[0], cv.CV_8UC4)
            this.myMean = new cv.Mat(1, 4, cv.CV_64F)
            this.myStddev = new cv.Mat(1, 4, cv.CV_64F)
            this.cap = new cv.VideoCapture(this.flow_tag.current)
            if(!this.props.paused) this.play()
        }

        // check if cv is already runtime-ready
        if (cv.Mat == undefined) {
            cv['onRuntimeInitialized'] = cv_init
        } else {
            cv_init()
        }        

        // update the ratio of flow_res / video_res
        let observer = new ResizeObserver((entries) => {
            this.rect = entries[0].contentRect
            this.ratio = this.props.flow_res[0] / this.rect.width
        })
        observer.observe(this.video_tag.current)

        this.video_tag.current.addEventListener('loadedmetadata', (e: Event) => {
            this.props.onLoad(this.video_tag.current)
        })

        this.video_tag.current.addEventListener('ended', (e: Event) => {
            this.props.onEnded(e)
            this.pause()
        })

        // preload video and flow video
        Promise.all([
            fetch(this.props.url)
                .then(response => response.blob())
                .then(blob=>{
                    this.video_tag.current.src = window.URL.createObjectURL(blob)
                }),
            fetch(this.props.flow_url)
                .then(response => response.blob())
                .then(blob=>{
                    this.flow_tag.current.src = window.URL.createObjectURL(blob)
                })])
        .then(res=>{
            this.setState({ready: true})
        })
        .catch(err => {
            this.props.onError('There has been an error while loading the videos.', err)
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
        const mouse_normalized = this.props.getMousePosition()

        if (!this.props.opticalFlowEnabled || mouse_normalized === undefined) {
            this.delay = 0//16
            this.cap.read(this.frame_flow)
            this.flow_tag.current.seekToNextFrame().then(()=>{
                this.video_tag.current.seekToNextFrame().then(()=>{
                    this.props.onFrame(this.frame, this.delay)
                    this.frame += 1
                })
            })
        } else {
            const mouse = [mouse_normalized[0] * this.rect.width, mouse_normalized[0] * this.rect.height]
            // start processing.

            this.cap.read(this.frame_flow)
            const x1 = Math.max(0, mouse[0] * this.ratio - 10)
            const x2 = Math.min(mouse[0] * this.ratio + 10, this.props.flow_res[0])
            const y1 = Math.max(0, mouse[1] * this.ratio - 10)
            const y2 = Math.min(mouse[1] * this.ratio + 10, this.props.flow_res[1])

            const rect = new cv.Rect(x1, y1, x2-x1, y2-y1)
            const roi = this.frame_flow.roi(rect)
            cv.meanStdDev(roi, this.myMean, this.myStddev)
            this.delay = 0//this.myMean.doubleAt(0, 0)

            this.flow_tag.current.seekToNextFrame().then(()=>{
                this.video_tag.current.seekToNextFrame().then(()=>{
                    this.props.onFrame(this.frame, this.delay)
                    this.frame += 1
                })
            })
        }
    }

    public play() {
        if(!this.state.ready) return myinfo('Video is loading. Please wait a few seconds and try again.')

        this.video_tag.current.onseeked = () => {
            this.timeout_id = window.setTimeout(() => {
                this.req_id = window.requestAnimationFrame(this.processVideo)
            }, Math.round(this.delay / this.props.rate))
        }
        this.req_id = window.requestAnimationFrame(this.processVideo)
    }

    public pause() {
        if(this.timeout_id) {
            clearTimeout(this.timeout_id)
            this.timeout_id = false
        }
        window.cancelAnimationFrame(this.req_id)
        this.req_id = false
        this.video_tag.current.onseeked = undefined
    }

    public restart() {
        this.currentTime(0)
    }

    public currentTime(t?: number) {
        if(t !== undefined) {
            this.video_tag.current.currentTime = t
            this.flow_tag.current.currentTime = t
            this.frame = Math.round(t * this.props.fps)
            this.props.setPaused(true) // pause the video
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
            <video ref={this.video_tag} width="100%" crossOrigin="Anonymous" disablePictureInPicture muted> 
            </video>
            <video ref={this.flow_tag} width={this.props.flow_res[0]} height={this.props.flow_res[1]} crossOrigin="Anonymous" style={{ display: 'none' }} preload="auto" muted>
            </video>
        </>
    }
}

export default OpencvFlowPlayer