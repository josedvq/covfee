import * as React from 'react'
import './html5.css'

import { HTML5PlayerSpec } from '@covfee-types/players/html5'
import { BasePlayerProps, CovfeeContinuousPlayer, ContinuousPlayerProps } from './base'
import {PlayerBar} from './videoplayer_bar'

import { urlReplacer} from '../utils'

export interface Props extends ContinuousPlayerProps, HTML5PlayerSpec {
    /**
     * The numerical ID of the currently-active media element (for multiple video support)
     */
    activeMedia: number
}

interface State {
    duration: number,
}

export class HTML5Player extends CovfeeContinuousPlayer<Props, State> {
    state: State = {
        duration: null
    }

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
            this.setState({duration: activeVideoTag.duration})
            this.props.onLoad(activeVideoTag.duration)
            this.setActiveVideo(0)
        })

        if (this.props.media.speed) activeVideoTag.playbackRate = this.props.media.speed
    }

    componentDidUpdate(prevProps: Props) {
        // Typical usage (don't forget to compare props):
        if (this.props.paused !== prevProps.paused) {
            if(this.props.paused) this.pause()
            else this.play()
        }
        if (this.props.speed !== prevProps.speed) {
            const activeVideoTag = this.videoTags[this.active_idx].current
            activeVideoTag.playbackRate = this.props.speed
        }
        if (this.props.activeMedia !== prevProps.activeMedia) {
            this.setActiveVideo(this.props.activeMedia)
        }
    }

    componentWillUnmount() {
        if(this.videoFrameCallbackId) {
            if(this.props.useRequestAnimationFrame) 
                cancelAnimationFrame(this.videoFrameCallbackId)
            else
                (this.videoTags[this.active_idx].current as any).cancelVideoFrameCallback(this.videoFrameCallbackId)
        }
    }

    handleEnd = () => {
        this.props.onEnd()
        this.pause()
    }

    setActiveVideo = (idx:number, notrigger?: boolean) => {
        // copy video to canvas
        
        this.videoTags[this.active_idx].current.removeEventListener('ended', this.handleEnd)
        this.videoTags[idx].current.addEventListener('ended', this.handleEnd)

        // copy over the currentTime of the previous active video
        if (this.isMultiview) {
            this.videoTags[idx].current.currentTime = this.videoTags[this.active_idx].current.currentTime

            if(!notrigger)
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
        this.videoFrameCallbackId = (this.videoTags[this.active_idx].current as any).requestVideoFrameCallback(this.onVideoFrameCallback)
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
            this.videoFrameCallbackId = (this.videoTags[this.active_idx].current as any).requestVideoFrameCallback(this.onVideoFrameCallback)
        
        this.videoTags.forEach(tag=>{
            tag.current.play()
        })
    }

    pause() {
        if (this.props.useRequestAnimationFrame)
            cancelAnimationFrame(this.videoFrameCallbackId)
        else
            (this.videoTags[this.active_idx].current as any).cancelVideoFrameCallback(this.videoFrameCallbackId)
        this.videoFrameCallbackId = null
        this.videoTags.forEach(tag=>{
            tag.current.pause()
        })
    }

    currentTime = (time?: number, callback?: ()=>{}) => {
        if(!this.videoTags[this.active_idx].current) return null

        if(time !== undefined) {
            this.videoTags[this.active_idx].current.currentTime = time
            this.props.setPaused(true) // pause the video

            const handleTimeUpdate = () => {
                this.copyVideoToCanvas()
                this.videoTags[this.active_idx].current.removeEventListener('timeupdate', handleTimeUpdate)
            }
            this.videoTags[this.active_idx].current.addEventListener('timeupdate', handleTimeUpdate)
            
            if(callback) callback()
        } else {
            return this.videoTags[this.active_idx].current.currentTime
        }
    }

    renderBar = () => {
        return <PlayerBar
                    duration={this.state.duration}
                    currentTime={()=>{return this.currentTime()}}
                    paused={this.props.paused}
                    setPaused={this.props.setPaused}
                    speed={this.props.speed}
                    setSpeed={this.props.setSpeed}
                    muted={this.props.muted}
                    setMuted={this.props.setMuted}/>
    }

    renderMultiview = () => {
        if(this.props.media.type !== 'video-multiview') return
        return <div className='html5player'>
            {this.renderBar()}
            <canvas ref={this.canvasTag} className='video-canvas' width={800} height={450}/>
            <div className='video-multiview-selector'>
                {this.props.media.url.map((url, idx)=>{
                    const isCurrent = (idx === this.active_idx)
                    return <video 
                        key={idx}
                        style={{width: (100/this.props.media.url.length) + '%'}} 
                        onClick={()=>{if(this.props.paused) this.setActiveVideo(idx)}}
                        ref={this.videoTags[idx]}
                        src={urlReplacer(url)}
                        crossOrigin="Anonymous" 
                        preload="auto"
                        muted={this.props.media.muted || !isCurrent}/>
                })}
            </div>
        </div>
    }

    renderSingleview = () => {
        if (this.props.media.type !== 'video') return
        return <div className='html5player' style={{backgroundColor: 'black'}}>
            {this.renderBar()}
            <video style={{width: '100%', maxHeight: 'calc(80vh)'}} 
                ref={this.videoTags[0]} 
                src={urlReplacer(this.props.media.url)} 
                crossOrigin="Anonymous" 
                preload="auto"
                muted={this.props.media.muted}/>
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