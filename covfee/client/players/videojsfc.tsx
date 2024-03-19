// Videojs functional component as recommended
import React from "react"
import videojs, { VideoJsPlayerOptions } from "video.js"
import "video.js/dist/video-js.css"

interface Props {
  options: VideoJsPlayerOptions
  onReady?: (player: videojs.Player) => void
}

export const VideoJSFC: React.FC<Props> = (props) => {
  const videoRef = React.useRef(null)
  const playerRef = React.useRef(null)
  const { options, onReady } = props

  React.useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current) {
      // The Video.js player needs to be _inside_ the component el for React 18 Strict Mode.
      const videoElement = document.createElement("video-js")

      videoElement.classList.add("vjs-big-play-centered")
      videoRef.current.appendChild(videoElement)

      const player = (playerRef.current = videojs(videoElement, options, () => {
        onReady && onReady(player)
      }))

      // You could update an existing player in the `else` block here
      // on prop change, for example:
    } else {
      const player = playerRef.current

      player.autoplay(options.autoplay)
      player.src(options.sources)
    }
  }, [options, videoRef])

  // Dispose the Video.js player when the functional component unmounts
  React.useEffect(() => {
    const player = playerRef.current

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose()
        playerRef.current = null
      }
    }
  }, [playerRef])

  return (
    <div data-vjs-player>
      <div ref={videoRef} />
    </div>
  )
}

export default VideoJSFC
