import * as React from 'react'
import { AudioSpec } from 'Tasks/task'
import WaveSurfer from 'wavesurfer.js'

interface Props extends AudioSpec {
    /**
     * Indicates if the audio is paused or playing
     */
    paused: boolean,
    onPlay?: Function,
    onPause?: Function,
    onEnded?: Function
    /**
     * Options from https://wavesurfer-js.org/docs/options.html
     */
    waveSurferOptions?: any
}

class WaveSurferBasicPlayer extends React.PureComponent<Props> {
    player: any
    container = React.createRef<HTMLDivElement>()

    componentDidMount() {
        this.player = WaveSurfer.create({
            container: this.container.current,
            waveColor: 'violet',
            progressColor: 'purple',
            interact: false,
            ...this.props.waveSurferOptions
        })

        this.player.load(this.props.url)
        
        if(!this.props.paused) {
            this.player.on('ready', ()=> {
                this.player.play()
            })
        }

        if (this.props.onPlay) {
            this.player.on('play', (e: Event) => {
                this.props.onPlay(e)
            })
        }

        if (this.props.onPause) {
            this.player.on('pause', (e: Event) => {
                this.props.onPause(e)
            })
        }

        if (this.props.onEnded) {
            this.player.on('ended', (e: Event) => {
                this.props.onEnded(e)
            })
        }
    }

    componentDidUpdate(prevProps: Props) {
        // Typical usage (don't forget to compare props):
        if (this.props.paused !== prevProps.paused) {
            if (this.props.paused) this.pause()
            else this.play()
        }
    }

    play() {
        this.player.play()
    }

    pause() {
        this.player.pause()
    }

    playPause() {
        this.player.playPause()
    }

    currentTime() {
        return this.player.getCurrentTime()
    }

    render() {
        return <>
            Wavesurfer player
            <div ref={this.container}></div>
        </>
    }
}

export default WaveSurferBasicPlayer