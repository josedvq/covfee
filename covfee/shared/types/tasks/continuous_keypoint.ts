import { OpencvFlowPlayerMedia } from '../players/opencv';
import { ContinuousTaskSpec } from '../task'

/**
* @TJS-additionalProperties false
*/
export interface ContinuousKeypointTaskSpec extends ContinuousTaskSpec {
    /**
     * @default "ContinuousKeypointTask"
     */
    type: 'ContinuousKeypointTask'
    /**
     * Media file to be displayed.
     */
    media: OpencvFlowPlayerMedia,
    /**
     * sets the input button controls for the task
     */
    controls?: {
        /**
         * speed up video playback
         */
        'speed-up'?: string
        /**
         * slow down video playback
         */
        'speed-down'?: string
        /**
         * toggle play/pause
         */
        'play-pause'?: string
        /**
         * go back 2s in video time
         */
        'back2s'?: string
        /**
         * go back 10s in video time
         */
        'back10s'?: string
        /**
         * toggle the occlusion flag (for occluded objects/parts)
         */
        'toggle-occluded'?: string
        /**
         * toggle the optical-flow-based speed adjustment
         */
        'toggle-of'?: string
    }
}