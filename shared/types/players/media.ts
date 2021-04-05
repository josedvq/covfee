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
}

export interface MultiviewVideo {
    /**
     * @default "video-multiview"
     */
    type: 'video-multiview'
    /**
     * URL to video files
     */
    url: Array<string>
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