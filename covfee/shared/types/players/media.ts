/**
 * Identifies a single video file
 * @title video
 */
export interface BasicVideo {
    /**
     * @default "video"
     */
    type: 'video'
    /**
     * URL to hosted video file
     */
    url: string
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
     * Speed of the video in multiples of real time (1x)
     */
    speed?: number
}

export interface MultiviewVideo {
    /**
     * @default "video-multiview"
     */
    type: 'video-multiview'
    /**
     * URL to video files
     */
    url: Array<string>,
    /**
     * Frames per second of the video file.
     * Some tasks use it to collect data once per frame.
     */
    fps?: number
    /**
     * Video should be played without audio
     */
    muted?: boolean,
    /**
     * Speed of the video in multiples of real time (1x)
     */
    speed?: number
}

export interface VideoSpec extends BasicVideo {
    
}

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