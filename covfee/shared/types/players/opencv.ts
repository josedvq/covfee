import { BasicVideo } from './media'
export interface OpencvFlowPlayerMedia extends BasicVideo {
    /**
     * Video resolution.
     */
    res: [number, number]
    /**
     * Video fps. Required to obtain frame number from time (since frame number is not directly accesible in browsers).
     */
    fps: number
    /**
     * URL of the optical flow extracted from the video. The number of frames in this file should match that of the video.
     */
    flow_url: string,
    /**
     * Resolution of the optical flow video. May be lower than the video resolution for performance reasons.
     */
    flow_res: [number, number]
}