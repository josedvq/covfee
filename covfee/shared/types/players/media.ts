/**
 * Media interface for the CovfeeVideoPlayer class
 */
 export interface BaseVideo {
    /**
     * Frames per second of the video file.
     * Some tasks use it to collect data once per frame.
     */
    fps?: number,
    /**
     * Video should be played without audio
     */
    muted?: boolean,
    /**
     * User is able to mute the video
     */
    canMute?: boolean,
    /**
     * Speed of the video in multiples of real time (1x)
     * 0 will allow the user to change speed (starting at 1x)
     */
    speed?: number
}

/**
 * Identifies a single video file
 * @title video
 */
export interface BasicVideo extends BaseVideo{
    /**
     * @default "video"
     */
    type: 'video'
    /**
     * URL to hosted video file
     */
    url: string
}

export interface MultiviewVideo extends BaseVideo {
    /**
     * @default "video-multiview"
     */
    type: 'video-multiview'
    /**
     * URL to video files
     */
    url: Array<string>
}

export type VideoSpec = BasicVideo | MultiviewVideo

/**
 * Identifies a single audio file
 * @title audio
 */
export interface BasicAudio {
    /**
     * @default "audio"
     */
    type: 'audio'
    /**
     * URL to hosted video file
     */
    url: string
}