import * as React from 'react'
import './html5.css'

import { HTML5PlayerSpec } from '@covfee-types/players/html5'
import { BasePlayerProps } from '@covfee-types/players/base'


export interface Props extends BasePlayerProps, HTML5PlayerSpec {}

export class HTML5Player extends React.PureComponent<Props> {
    canvasTag = React.createRef<HTMLCanvasElement>()
    canvasCtx: CanvasRenderingContext2D
    videoTags = Array<React.RefObject<HTMLVideoElement>>()

    // props
    isMultiview: boolean

    // state
    active_idx = 0
    time: number = 0

    // Ids
    videoFrameCallbackId: number = null

    constructor(props: Props) {
        super(props)

        this.isMultiview = (this.props.media.type == 'video-multiview')

        if (this.isMultiview) {
            this.videoTags = []
            for(let i=0; i<this.props.media.url.length; i++) {
                this.videoTags.push(React.createRef<HTMLVideoElement>())
            }
        } else {
            this.videoTags = [React.createRef<HTMLVideoElement>()]
        }
    }

    componentDidMount() {
        if (this.isMultiview)
            this.canvasCtx = this.canvasTag.current.getContext('2d')

        const activeVideoTag = this.videoTags[this.active_idx].current
        activeVideoTag.addEventListener('loadeddata', (e: Event) => {
            this.props.onLoad(activeVideoTag.duration)
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
            if(this.props.useRequestAnimationFrame) 
                cancelAnimationFrame(this.videoFrameCallbackId)
            else
                this.videoTags[this.active_idx].current.cancelVideoFrameCallback(this.videoFrameCallbackId)
        }
    }

    handleEnd = (e: Event) => {
        this.props.onEnd(e)
        this.pause()
    }

    setActiveVideo = (idx:number) => {
        // copy video to canvas
        
        this.videoTags[this.active_idx].current.removeEventListener('ended', this.handleEnd)
        this.videoTags[idx].current.addEventListener('ended', this.handleEnd)

        // copy over the currentTime of the previous active video
        if (this.isMultiview) {
            this.videoTags[idx].current.currentTime = this.videoTags[this.active_idx].current.currentTime

            this.props.onEvent('vidswitch', this.active_idx, idx)
            this.active_idx = idx
            this.copyVideoToCanvas()
        }
    }

    copyVideoToCanvas = () => {
        // copy the video content to the main canvas
        const width = this.canvasTag.current.width
        const height = this.canvasTag.current.height
        this.canvasCtx.drawImage(this.videoTags[this.active_idx].current,0,0,width,height)
    }

    onFrame = (time: number) => {
        if (time !== this.time) {
            this.time = time
            this.props.onFrame(this.time)
        }

        if (this.props.media.type == 'video-multiview')
            this.copyVideoToCanvas()
    }

    onVideoFrameCallback = (now: number, metadata: any) => {
        // call the onFrame event
        const time = metadata.mediaTime
        this.onFrame(time)
        this.videoFrameCallbackId = this.videoTags[this.active_idx].current.requestVideoFrameCallback(this.onVideoFrameCallback)
    }

    onRequestAnimationFrame = () => {
        // call the onFrame event
        const time = this.videoTags[this.active_idx].current.currentTime
        this.onFrame(time)
        this.videoFrameCallbackId = requestAnimationFrame(this.onRequestAnimationFrame)
    }

    play() {
        if(this.props.useRequestAnimationFrame)
            this.videoFrameCallbackId = requestAnimationFrame(this.onRequestAnimationFrame)
        else
            this.videoFrameCallbackId = this.videoTags[this.active_idx].current.requestVideoFrameCallback(this.onVideoFrameCallback)
        
        this.videoTags.forEach(tag=>{
            tag.current.play()
        })
    }

    pause() {
        if (this.props.useRequestAnimationFrame)
            cancelAnimationFrame(this.videoFrameCallbackId)
        else
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
            this.props.setPaused(true) // pause the video
        } else {
            return this.videoTags[this.active_idx].current.currentTime
        }
    }

    renderMultiview = () => {
        if(this.props.media.type !== 'video-multiview') return
        return <div className='html5player'>
            <canvas ref={this.canvasTag} className='video-canvas' width={800} height={450}/>
            <div className='video-selector'>
                {this.props.media.url.map((url, idx)=>{
                    return <video 
                        key={idx}
                        style={{width: (100/this.props.media.url.length) + '%'}} 
                        onClick={()=>{if(this.props.paused) this.setActiveVideo(idx)}}
                        ref={this.videoTags[idx]} src={url} 
                        crossOrigin="Anonymous" 
                        preload="auto" muted/>
                })}
            </div>
        </div>
    }

    renderSingleview = () => {
        if (this.props.media.type !== 'video') return
        return <div className='html5player'>
            <video style={{width: '100%'}} 
                ref={this.videoTags[0]} 
                src={this.props.media.url} 
                crossOrigin="Anonymous" 
                preload="auto" muted/>
        </div>
    }

    render() {
        if(this.props.media.type == 'video-multiview') {
            return this.renderMultiview()
        } else {
            return this.renderSingleview()
        }
    }
}

export default HTML5Player