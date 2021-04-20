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
    fps?: number
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