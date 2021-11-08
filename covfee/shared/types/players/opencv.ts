import { BasicVideo } from './media'

export interface OpencvFlowPlayerMedia extends BasicVideo {
    /**
     * If true, the video file is assumed to include an optical flow video stacked horizontally, such that:
     * - the left half of the video contains the video to be displayed
     * - the right half of the video contains the optical flow video (hidden)
     */
    hasFlow?: boolean
    /**
     * Video fps. Required to obtain frame number from time (since frame number is not directly accesible in browsers).
     */
    fps: number
    /**
     * Video resolution
     */
    resolution: [number, number]
}

export interface OpencvFlowPlayerOptions {
    /**
     * Size of the square (LxL) around the cursor position to use for OF calculation
     */
    L: number
    /**
     * Lenght/stregth of the temporal smoothing
     */
    T: number
    /**
     * If true, a countdown is shown before the video plays
     */
    countdown?: boolean
}

