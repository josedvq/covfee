import { BasicVideo } from './media'
export interface OpencvFlowPlayerMedia extends BasicVideo {
    /**
     * Video resolution. This is the resolution of the original video. The final stacked video has double the horizontal resolution.
     */
    res: number[]
    /**
     * Video fps. Required to obtain frame number from time (since frame number is not directly accesible in browsers).
     */
    fps: number
}