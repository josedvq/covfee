export type PlayerOnLoad = (duration: number, fps?: number) => void
export type PlayerOnFrame = (arg0: number) => void
export type PlayerOnEnd = () => void

export interface BasePlayerProps {
    /**
     * Controls the play/pause state of the player
     */
    paused: boolean
    /**
     * Controls playback speed. A value of 1 should correspond to real-time playback.
     */
    speed: number
    /**
     * Controls whether the player is muted
     */
    muted: boolean
    /**
     * Changes the value of the paused prop
     */
    setPaused: (arg0: boolean) => void
    /**
     * Called when the media is loaded and ready to play.
     */
    onLoad: PlayerOnLoad
    /**
     * Called on every frame of the data. It is passed the media time.
     * Media time is obtained from the underlying HTML element
     */
    onFrame: PlayerOnFrame
    /**
     * Called when the media finishes playing
     */
    onEnd: PlayerOnEnd,
}

export type PlayerListenerProps = Pick<BasePlayerProps, 'onLoad' | 'onFrame' | 'onEnd'>

export type PlayerControllerProps = Pick<BasePlayerProps, 'paused' | 'setPaused'>