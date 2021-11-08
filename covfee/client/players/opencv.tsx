/* global cv */
declare global {
    var cv: any
}
import * as React from 'react'
import { OpencvFlowPlayerMedia, OpencvFlowPlayerOptions } from '@covfee-types/players/opencv'
import { urlReplacer } from '../utils'
import { CovfeeContinuousPlayer, ContinuousPlayerProps } from './base'
import { CaretRightOutlined, CloseOutlined, RiseOutlined } from '@ant-design/icons'
import { Button, Checkbox } from 'antd'

import {CountdownTimer} from './utils/countdown'
import { PlayerBar } from './videoplayer_bar'

// video player using opencv to control playback speed
interface Props extends ContinuousPlayerProps, OpencvFlowPlayerOptions {
    media: OpencvFlowPlayerMedia
    /**
     * Returns the mouse position, used to adjust the video playback speed.
     */
    getMousePosition: Function
    /**
     * Multiplier to the playback speed of the video
     */
    playbackRateMultiplier: number
    wrapPlayerElement: (arg0: React.ReactNode) => React.ReactNode
    /**
     * If true, automatic optical-flow-based speed adjustment is enabled
     * Only effective if a flow video is given and res is specified.
     */
    opticalFlowEnabled: boolean
    setOpticalFlowEnabled: (arg0: boolean) => void
}

interface State {
    /**
     * True while the countdown is active
     */
    countdownActive: boolean
    /**
     * The duration of the video
     */
    duration: number
    /**
     * If true OF-based speed adjustment is on
     */
    opticalFlowEnabled: boolean
}

export class OpencvFlowPlayer extends CovfeeContinuousPlayer<Props, State> {
    videoTag: HTMLVideoElement
    canvasTag: HTMLCanvasElement
    canvasCtx: CanvasRenderingContext2D

    cap: any // cv.VideoCapture
    frame_flow: any // cv.Mat
    myMean: any // cv.Mat
    myStddev: any // cv.Mat

    req_id: any = false
    rect: DOMRectReadOnly
    ratio: number = 0.5

    rates: number[]
    ratesIndex = 0

    state = {
        countdownActive: false,
        duration: 0,
        opticalFlowEnabled: false
    }

    static defaultProps = {
        L: 10,
        T: 0, // disabled by default
        countdown: true,
        opticalFlowEnabled: true,
        playbackRateMultiplier: 1
    }

    countdownTimeoutId: any = null

    constructor(props: Props) {
        super(props)

        this.state.opticalFlowEnabled = !!props.media.hasFlow && props.opticalFlowEnabled
        this.rates = Array(props.T).fill(1.0)
    }

    opencv_init = () => {
        const cv_init = () => {
            this.frame_flow = new cv.Mat(this.props.media.resolution[1], this.props.media.resolution[0]*2, cv.CV_8UC4)


            this.myMean = new cv.Mat(1, 4, cv.CV_64F)
            this.myStddev = new cv.Mat(1, 4, cv.CV_64F)
            this.cap = new cv.VideoCapture(this.videoTag)
            if(!this.props.paused) this.play()
        }

        // check if cv is already runtime-ready
        if (cv.Mat == undefined) {
            cv['onRuntimeInitialized'] = cv_init
        } else {
            cv_init()
        }
    }

    componentDidMount() {
        const self = this
        this.videoTag.addEventListener('loadedmetadata', function(e) {
            // init opencv
            if(self.state.opticalFlowEnabled) {
                self.opencv_init()
            }
        }, false)

        this.canvasCtx = this.canvasTag.getContext('2d')

        // preload video and flow video
        fetch(urlReplacer(this.props.media.url))
            .then(response => response.blob())
            .then(blob=>{
                this.videoTag.src = window.URL.createObjectURL(blob)
            })
            .catch(err => {
                this.props.onError('There has been an error while loading the videos.', err)
            })

        this.videoTag.addEventListener('loadeddata', (e: Event) => {
            this.copyVideoToCanvas()
            this.setState({duration: this.videoTag.duration})
            this.props.onLoad(this.videoTag.duration, this.props.media.fps)
        })

        this.videoTag.addEventListener('ended', _=> {
            this.props.onEnd()
            this.pause()
        })
    }

    componentDidUpdate(prevProps: Props) {
        // Typical usage (don't forget to compare props):
        if (this.props.paused !== prevProps.paused) {
            if(this.props.paused) this.pause()
            else {
                if(this.props.countdown)
                    this.startPlayCountdown()
                else
                    this.play()
            }
        }

        // enable OF if res props is present.
        if (this.props.opticalFlowEnabled !== prevProps.opticalFlowEnabled) {
            this.setState({
                opticalFlowEnabled: !!this.props.media.hasFlow && this.props.opticalFlowEnabled
            }, () => {
                if(this.state.opticalFlowEnabled)
                this.opencv_init()
            })
        }
    }

    copyVideoToCanvas = () => {
        // copy the video content to the main canvas
        const width = this.canvasTag.width
        const height = this.canvasTag.height
        this.canvasCtx.drawImage(this.videoTag, 0, 0, this.props.media.resolution[0], this.props.media.resolution[1], 0, 0, width, height)
    }

    getRatesMovingAverage = () => {
        const sum = this.rates.reduce((a, b) => a + b, 0)
        return (sum / this.rates.length) || 0
    }

    frameCallback = () => {
        let rate;
        if(this.state.opticalFlowEnabled) {
            const mouse_normalized = this.props.getMousePosition()

            const mouse = [
                mouse_normalized[0] * this.props.media.resolution[0],
                mouse_normalized[1] * this.props.media.resolution[1]
            ]

            // start processing.
            this.cap.read(this.frame_flow)
            const x1 = Math.max(0, mouse[0] - this.props.L)
            const x2 = Math.min(mouse[0] + this.props.L, this.props.media.resolution[0])
            const y1 = Math.max(0, mouse[1] - this.props.L)
            const y2 = Math.min(mouse[1] + this.props.L, this.props.media.resolution[1])

            const rect = new cv.Rect(this.props.media.resolution[0] +x1, y1, x2-x1, y2-y1)
            const roi = this.frame_flow.roi(rect)
            cv.meanStdDev(roi, this.myMean, this.myStddev)
            const delay = Math.max(1.0, this.myMean.doubleAt(0, 0))

            
            rate = (1.0 / delay) *  this.props.playbackRateMultiplier
            rate = Math.min(4.0, Math.max(0.1, rate))

            // cap the rate when it goes above the moving average
            if(this.props.T != 0) {
                const rateMA = this.getRatesMovingAverage()
                if(rate > rateMA) {
                    rate = Math.min(rate, rateMA*1.2)
                }
            }

        } else {
            rate = 1 * this.props.playbackRateMultiplier    
        }
        this.videoTag.playbackRate = rate
        this.rates[(this.ratesIndex++) % this.props.T] = rate

        this.props.onFrame(this.videoTag.currentTime)
        this.req_id = (this.videoTag as any).requestVideoFrameCallback(this.frameCallback)
        this.copyVideoToCanvas()
    }

    play() {
        this.videoTag.play()
        this.req_id = (this.videoTag as any).requestVideoFrameCallback(this.frameCallback)
    }

    startPlayCountdown = () => {
        this.setState({countdownActive: true})
        this.countdownTimeoutId = setTimeout(()=>{
            this.setState({countdownActive: false}, ()=>{this.play()})
        }, 1500)
    }

    pause() {
        this.videoTag.pause()
        this.req_id = false
    }

    restart() {
        this.currentTime(0)
    }

    currentTime = (time?: number, callback?: ()=>{}) => {
        if(!this.videoTag) return null
        if(time !== undefined) {
            this.videoTag.currentTime = time
            this.props.setPaused(true) // pause the video
            if(callback) return callback()
        }
        else return this.videoTag.currentTime
    }

    handleToggleOpticalFlow = () => {
        this.props.setOpticalFlowEnabled(!this.props.opticalFlowEnabled)
    }

    renderBar = () => {
        let pr_str = ''
        if(Number.isInteger(this.props.playbackRateMultiplier)) {
            pr_str = this.props.playbackRateMultiplier.toString()
        } else {
            pr_str = this.props.playbackRateMultiplier.toPrecision(2)
        }

        return <PlayerBar
            duration={this.state.duration}
            currentTime={this.currentTime}
            paused={this.props.paused}
            setPaused={this.props.setPaused}
            speed={this.props.speed}
            setSpeed={this.props.setSpeed}
            muted={this.props.muted}
            setMuted={this.props.setMuted}>
            <div className="annot-bar-right">
                <CaretRightOutlined /> 
                <Button size='small' type='primary' danger>{pr_str}</Button> <CloseOutlined /> 
                <Button size='small' danger={this.props.opticalFlowEnabled} type={this.props.opticalFlowEnabled ? 'primary' : 'default'}>
                    <RiseOutlined /> <Checkbox checked={this.props.opticalFlowEnabled} onChange={this.handleToggleOpticalFlow}></Checkbox>
                </Button>
            </div>
        </PlayerBar>
    }

    render() {
        return <>

            {this.renderBar()}
            {this.props.wrapPlayerElement(
                <div style={{position: 'relative'}}>
                    <canvas 
                        ref={e=>{this.canvasTag = e}}
                        style={{width: '100%'}}
                        width={800}
                        height={450}/>
                    {this.state.countdownActive && <CountdownTimer/>}
                </div>
            )}
            
            <video 
                ref={e=>{this.videoTag = e}}
                width={1920}
                height={540}
                crossOrigin="Anonymous"
                style={{ display: 'none' }}
                preload="auto"
                disablePictureInPicture
                muted/>
        </>
    }
}

export default OpencvFlowPlayer