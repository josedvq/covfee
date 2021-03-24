import * as React from 'react'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'
import { VideojsPlayerMedia } from '@covfee-types/players/videojs'

interface Props extends VideojsPlayerMedia {
    /**
     * Paused status of the video
     */
    paused: boolean,
    /**
     * videojs option. If true the video will be played as soon as the component loads.
     */
    autoplay?: boolean,
    /**
     * videojs option. If true the video player will display controls
     */
    controls?: boolean,
    /**
     * videojs option. If true the video player will be resizable
     */
    fluid?: boolean,
    /**
     * videojs option. Aspect ratio of the player frame, eg: 16:9 or 4:3
     */
    aspectRatio?: string,
    onPlay?: Function,
    onPause?: Function,
    onEnded?: Function
}
// video.js player from the docs: https://github.com/videojs/video.js/blob/master/docs/guides/react.md
class VideojsPlayer extends React.PureComponent<Props> {
    player: videojs.Player
    private videoNode = React.createRef<HTMLVideoElement>()

    static defaultProps = {
        paused: true,
        autoplay: false,
        controls: true,
        fluid: true,
        aspectRatio: '16:9'
    }

    componentDidMount() {
        let options = {
            autoplay: this.props.autoplay,
            controls: this.props.controls,
            fluid: this.props.fluid,
            aspectRatio: this.props.aspectRatio,
            sources: [{
                src: this.props.url,
                type: 'video/mp4'
            }]
        }
        // instantiate Video.js
        this.player = videojs(this.videoNode.current, options)

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

    public play() {
        this.player.play()
    }

    public playbackRate(rate: number) {
        this.player.playbackRate(rate)
    }

    public toggle_play_pause() {
        if (this.player.paused()) {
            this.player.play()
        } else {
            this.player.pause()
        }
    }

    public currentTime(t: number) {
        return this.player.currentTime(t)
    }

    // destroy player on unmount
    componentWillUnmount() {
        if (this.player) {
            this.player.dispose()
        }
    }

    // wrap the player in a div with a `data-vjs-player` attribute
    // so videojs won't create additional wrapper in the DOM
    // see https://github.com/videojs/video.js/pull/3856

    // use `ref` to give Video JS a reference to the video DOM element: https://reactjs.org/docs/refs-and-the-dom
    render() {
        return (
            <div data-vjs-player>
                <video ref={this.videoNode} className="video-js"></video>
            </div>
        )
    }
}

export default VideojsPlayer