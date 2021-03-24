import * as React from 'react'
import {
    Button
} from 'antd'
import WaveSurfer from 'wavesurfer.js'
import { WavesurferPlayerMedia } from '@covfee-types/players/wavesurfer'

interface Props extends WavesurferPlayerMedia {
    /**
     * called when the audio starts playing
     */
    onPlay?: Function,
    /**
     * called whenever the audio is paused
     */
    onPause?: Function,
    /**
     * called when the audio starts playing
     */
    onEnded?: Function
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

class WaveSurferBasicPlayer extends React.PureComponent<Props, State> {
    state: State = {
        paused: true
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

        this.player.load(this.props.url)
        
        this.player.on('play', (e: Event) => {
            this.setState({paused: false})
            if (this.props.onPlay) this.props.onPlay(e)
        })
        this.player.on('pause', (e: Event) => {
            this.setState({paused: true})
            if (this.props.onPause) this.props.onPause(e)
        })
        if (this.props.onEnded) this.player.on('ended', this.props.onEnded)
    }

    play = () => {
        this.player.play()
    }

    pause = () => {
        this.player.pause()
    }

    playPause = () => {
        this.player.playPause()
    }

    currentTime = () => {
        return this.player.getCurrentTime()
    }

    render() {
        const button = <Button onClick={this.playPause} type="primary">
            {this.state.paused ? 'Play': 'Pause'}
        </Button>
        return <div style={{margin: '2em'}}>
            <div ref={this.container}></div>
            {button}
        </div>
    }
}

export default WaveSurferBasicPlayer
