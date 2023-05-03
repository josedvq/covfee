import { Intensity1DInputSpec } from 'spec/input/1d_intensity'
import { BaseTaskSpec} from '../task'
import { HTML5PlayerMedia} from '../players/html5'
import { Trace1DInputSpec } from 'spec/input/1d_trace'

/**
* @TJS-additionalProperties false
*/
export interface Continuous1DTaskBaseSpec {
    /**
     * @default "Continuous1DTask"
     */
    type: 'Continuous1DTask'
    /**
     * Media file to be displayed.
     */
    media: HTML5PlayerMedia
    /**
     * Uses requestAnimationFrame as trigger for data reads.
     * requestAnimationFrame normally fires at close to 60Hz
     * Setting to true can improve the quality for lower framerate media by capturing data points between frames.
     * If enabled, data annotations may not align with media frame times.
     * @default false
     */
    useRequestAnimationFrame?: boolean
    /**
     * Enable player's countdown animation
     */
    showCountdown?: boolean
    /**
     * sets the input button controls for the task
     */
    controls?: {
        'play-pause'?: string
        'back2s'?: string
        'back10s'?: string
    }
    /**
     * sets the type of intensity input
     */
    intensityInput: Trace1DInputSpec | Intensity1DInputSpec
}

/**
* @TJS-additionalProperties false
*/
export interface Continuous1DTaskSpec extends Continuous1DTaskBaseSpec, BaseTaskSpec {}