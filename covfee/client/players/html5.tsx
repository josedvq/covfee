import * as React from 'react'
import './html5.css'
import { HTML5PlayerMedia } from '@covfee-types/players/html5'

// video player using opencv to control playback speed
interface Props extends HTML5PlayerMedia {
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
    canvasTag = React.createRef<HTMLCanvasElement>()
    canvasCtx: CanvasRenderingContext2D
    videoTags = Array<React.RefObject<HTMLVideoElement>>(this.props.url.length)


    // state
    active_idx = 0
    frame: number = 0
    time: number = 0

    // Ids
    videoFrameCallbackId: number = null

    constructor(props: Props) {
        super(props)

        for(let i=0; i<this.props.url.length; i++) {
            this.videoTags[i] = React.createRef<HTMLVideoElement>()
        }
    }

    componentDidMount() {
        
        this.canvasCtx = this.canvasTag.current.getContext('2d')

        this.videoTags[this.active_idx].current.addEventListener('loadeddata', (e: Event) => {
            this.setActiveVideo(0)
        })
    }

    componentDidUpdate(prevProps: Props) {
        // Typical usage (don't forget to compare props):
        if (this.props.paused !== prevProps.paused) {
            if(this.props.paused) this.pause()
            else this.play()
        }
    }

    componentWillUnmount() {
        if(this.videoFrameCallbackId) {
            this.videoTags[this.active_idx].current.cancelVideoFrameCallback(this.videoFrameCallbackId)
        }
    }

    handleEnd = (e: Event) => {
        this.props.onEnded(e)
        this.pause()
    }

    setActiveVideo = (idx:number) => {
        // copy video to canvas
        
        this.videoTags[this.active_idx].current.removeEventListener('ended', this.handleEnd)
        this.videoTags[idx].current.addEventListener('ended', this.handleEnd)

        // copy over the currentTime of the previous active video
        console.log([this.videoTags[idx].current.currentTime, this.videoTags[this.active_idx].current.currentTime])
        this.videoTags[idx].current.currentTime = this.videoTags[this.active_idx].current.currentTime

        this.active_idx = idx
        this.copyVideoToCanvas()
    }

    copyVideoToCanvas = () => {
        // copy the video content to the main canvas
        const width = this.canvasTag.current.width
        const height = this.canvasTag.current.height
        this.canvasCtx.drawImage(this.videoTags[this.active_idx].current,0,0,width,height)
    }

    processVideo = (now, metadata) => {
        // call the onFrame event
        const time = metadata.mediaTime
        if(time !== this.time) {
            this.time = time
            this.frame = Math.round(time / this.props.fps)
            this.props.onFrame(this.frame)
        }
        
        this.copyVideoToCanvas()
        this.videoFrameCallbackId = this.videoTags[this.active_idx].current.requestVideoFrameCallback(this.processVideo)
    }

    play() {
        this.videoFrameCallbackId = this.videoTags[this.active_idx].current.requestVideoFrameCallback(this.processVideo)
        this.videoTags.forEach(tag=>{
            tag.current.play()
        })
    }

    pause() {
        this.videoTags[this.active_idx].current.cancelVideoFrameCallback(this.videoFrameCallbackId)
        this.videoFrameCallbackId = null
        this.videoTags.forEach(tag=>{
            tag.current.pause()
        })
    }

    restart() {
        this.currentTime(0)
    }

    currentTime(t?: number) {
        if(t !== undefined) {
            this.videoTags[this.active_idx].current.currentTime = t
            this.frame = Math.round(t * this.props.fps)
            this.props.pausePlay(true) // pause the video
        }
        else return this.videoTags[this.active_idx].current.currentTime
    }

    currentFrame(t?: number) {
        if (t !== undefined) {
            this.currentTime(t / this.props.fps)
        }
        else return this.frame
    }

    render() {
        return <div className='html5player'>
            <canvas ref={this.canvasTag} className='video-canvas' width={800} height={450}/>
            <div className='video-selector'>
                {this.props.url.map((url, idx)=>{
                    return <video 
                        key={idx}
                        style={{width: (100/this.props.url.length) + '%'}} 
                        onClick={()=>{if(this.props.paused) this.setActiveVideo(idx)}}
                        ref={this.videoTags[idx]} src={url} 
                        crossOrigin="Anonymous" 
                        preload="auto" muted/>
                })}
            </div>
        </div>
    }
}

export default HTML5Player