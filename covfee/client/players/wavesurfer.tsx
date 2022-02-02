import * as React from 'react'
import {
    Button
} from 'antd'
import WaveSurfer from 'wavesurfer.js'
import { WavesurferPlayerMedia } from '@covfee-types/players/wavesurfer'
import { ContinuousPlayerProps, CovfeeContinuousPlayer } from './base'

export interface Props extends ContinuousPlayerProps {
    /**
     * media file
     */
    media: WavesurferPlayerMedia
    /**
     * Options from https://wavesurfer-js.org/docs/options.html
     */
    waveSurferOptions?: any,
    /**
     * Show a play/pause button
     */
    playPauseButton: boolean
}

interface State {
    paused: boolean
}

export class WaveSurferPlayer extends CovfeeContinuousPlayer<Props, State> {
    state: State = {
        paused: true
    }

    player: WaveSurfer
    container = React.createRef<HTMLDivElement>()

    static defaultProps = {
        playPauseButton: true
    }

    _setPaused = (arg0: boolean) => {}
    isControlled = false
    prevPaused: boolean

    get paused() {
        if(this.isControlled) {
            return this.props.paused
        } else {
            return this.state.paused
        }
    }

    checkIfControlled() {
        if(this.props.paused === undefined) {
            this.isControlled = false
            this._setPaused = v => {this.setState({paused: v})}
        } else {
            this.isControlled = true
            this._setPaused = this.props.setPaused
        }
    }

    componentDidMount() {
        this.player = WaveSurfer.create({
            container: this.container.current,
            waveColor: 'violet',
            progressColor: 'purple',
            interact: false,
            ...this.props.waveSurferOptions
        })

        this.checkIfControlled()

        this.player.load(this.props.media.url)
        
        this.player.on('ended', ()=>{this.props.onEnd})
    }

    componentDidUpdate(prevProps: Props) {
        if(this.paused !== this.prevPaused) {
            if(this.paused) this.player.pause()
            else this.player.play()
        }
        this.prevPaused = this.paused
        // Typical usage (don't forget to compare props):
        // if (this.props.paused !== prevProps.paused) {
        //     if(this.props.paused) this.player.pause()
        //     else this.player.play()
        // }
        this.checkIfControlled()
    }

    play = () => {
        this._setPaused(false)
    }

    playPause = () => {
        this._setPaused(!this.paused)
    }

    currentTime = (time: number) => {
        if(time) this.player.setCurrentTime(time)
        else return this.player.getCurrentTime()
    }

    render() {
        const button = <Button onClick={this.playPause} type="primary">
            {this.paused ? 'Play': 'Pause'}
        </Button>
        return <div style={{margin: '2em'}}>
            <div ref={this.container}></div>
            {button}
        </div>
    }
}

export default WaveSurferPlayer
