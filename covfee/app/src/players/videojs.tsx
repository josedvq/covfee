import React from 'react'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'

import { ContinuousAnnotationPlayer } from './base'

// video.js player from the docs: https://github.com/videojs/video.js/blob/master/docs/guides/react.md
class VideojsPlayer extends ContinuousAnnotationPlayer {
    private player: any;

    componentDidMount() {
        // instantiate Video.js
        this.player = videojs(this.videoNode, this.props, function onPlayerReady() {
            console.log('onPlayerReady', this)
            this.play()
        });

        if (this.props.on_play) {
            this.player.on('play', (function (e) {
                this.props.on_play(e)
            }).bind(this))
        }

        if (this.props.on_pause) {
            this.player.on('pause', (function (e) {
                this.props.on_pause(e)
            }).bind(this))
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

    componentWillReceiveProps(newProps) {
        // When a user moves from one title to the next, the VideoPlayer component will not be unmounted,
        // instead its properties will be updated with the details of the new video. In this case,
        // we can update the src of the existing player with the new video URL.
        if (this.player) {
            this.player.src(newProps.sources[0])
        }
    }

    // wrap the player in a div with a `data-vjs-player` attribute
    // so videojs won't create additional wrapper in the DOM
    // see https://github.com/videojs/video.js/pull/3856

    // use `ref` to give Video JS a reference to the video DOM element: https://reactjs.org/docs/refs-and-the-dom
    render() {
        return (
            <div data-vjs-player>
                <video ref={node => this.videoNode = node} className="video-js"></video>
            </div>
        )
    }
}

export default VideojsPlayer