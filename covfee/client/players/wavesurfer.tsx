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
}

export class WaveSurferPlayer extends CovfeeContinuousPlayer<Props, State> {
    state: State = {
    }

    player: WaveSurfer
    container = React.createRef<HTMLDivElement>()

    static defaultProps = {
        playPauseButton: true
    }

    componentDidMount() {
        this.player = WaveSurfer.create({
            container: this.container.current,
            waveColor: 'violet',
            progressColor: 'purple',
            interact: false,
            ...this.props.waveSurferOptions
        })

        this.player.load(this.props.media.url)
        
        this.player.on('ended', ()=>{this.props.onEnd})
    }

    componentDidUpdate(prevProps: Props) {
        // Typical usage (don't forget to compare props):
        if (this.props.paused !== prevProps.paused) {
            if(this.props.paused) this.player.pause()
            else this.player.play()
        }
    }

    play = () => {
        this.props.setPaused(false)
    }

    pause = () => {
        this.player.pause()
    }

    playPause = () => {
        this.props.setPaused(!this.props.paused)
    }

    currentTime = (time: number) => {
        if(time) this.player.setCurrentTime(time)
        else return this.player.getCurrentTime()
    }

    render() {
        const button = <Button onClick={this.playPause} type="primary">
            {this.props.paused ? 'Play': 'Pause'}
        </Button>
        return <div style={{margin: '2em'}}>
            <div ref={this.container}></div>
            {button}
        </div>
    }
}

export default WaveSurferPlayer
