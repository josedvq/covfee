import cv from 'cv'

import { ContinuousAnnotationPlayer} from './base'

// video player using opencv to control playback speed
class OpencvFlowPlayer extends ContinuousAnnotationPlayer {
    private video_tag = React.createRef()
    private flow_tag = React.createRef()
    private cap: any
    private frame_flow: cv.Mat
    private myMean: cv.Mat
    private myStddev: cv.Mat

    private req_id: any = false
    private timeout_id: any = false
    private ratio: number = 0.5
    private delay: number = 0
    private frame = 0

    componentDidMount() {

        function cv_init() {
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

        // update rect and ratio when the resolution changes
        let observer = new ResizeObserver(function (entries) {
            this.rect = entries[0].contentRect
            this.ratio = this.props.flow.res[0] / this.rect.width
        }.bind(this))
        observer.observe(this.video_tag.current)

        this.video_tag.current.addEventListener('loadedmetadata', (e: Event) => {
            this.props.onLoad(this.video_tag.current)
        })

        this.video_tag.current.addEventListener('ended', (e: Event) => {
            this.props.onEnded(e)
            this.pause()
        })
    }

    componentDidUpdate(prevProps) {
        // Typical usage (don't forget to compare props):
        if (this.props.paused !== prevProps.paused) {
            if(this.props.paused) this.pause()
            else this.play()
        }
    }

    private processVideo() {
        const mouse = this.props.getMousePosition()
        if(mouse === undefined) {
            this.delay = 16
            this.flow_tag.current.seekToNextFrame().then(()=>{
                this.video_tag.current.seekToNextFrame().then(()=>{
                    this.props.onFrame(this.frame)
                    this.frame += 1
                })
            })
            
        } else {
            // start processing.
            this.cap.read(this.frame_flow)
            const x1 = Math.max(0, mouse[0] * this.ratio - 10)
            const x2 = Math.min(mouse[0] * this.ratio + 10, this.props.flow.res[0])
            const y1 = Math.max(0, mouse[1] * this.ratio - 10)
            const y2 = Math.min(mouse[1] * this.ratio + 10, this.props.flow.res[1])

            const rect = new cv.Rect(x1, y1, x2-x1, y2-y1)
            const roi = this.frame_flow.roi(rect)
            cv.meanStdDev(roi, this.myMean, this.myStddev)
            this.delay = this.myMean.doubleAt(0, 0)
            this.flow_tag.current.seekToNextFrame().then(()=>{
                this.video_tag.current.seekToNextFrame().then(()=>{
                    this.props.onFrame(this.frame)
                    this.frame += 1
                })
            })
            
        }
    }

    public play() {
        this.video_tag.current.onseeked = () => {
            this.timeout_id = setTimeout(() => {
                this.req_id = window.requestAnimationFrame(this.processVideo.bind(this))
            }, Math.round(this.delay / this.props.rate))
        }
        this.req_id = window.requestAnimationFrame(this.processVideo.bind(this))
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
        this.frame = 0
    }

    public currentTime(t: number) {
        if(t !== undefined) {
            this.video_tag.current.currentTime = t
            this.flow_tag.current.currentTime = t
            this.frame = Math.round(t * this.props.fps)
            this.props.pausePlay(true) // pause the video
        }
        else return this.video_tag.current.currentTime
    }

    public currentFrame(t: number) {
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
                    <source src={this.props.video.src} type={"video/mp4"}></source>
                </video>
                <video ref={this.flow_tag} width={this.props.flow.res[0]} height={this.props.flow.res[1]} crossOrigin="Anonymous" style={{ display: 'none' }} preload="auto" muted>
                    <source src={this.props.flow.src} type={"video/mp4"}></source>
                </video>
            </>
    }
}

export default OpencvFlowPlayer