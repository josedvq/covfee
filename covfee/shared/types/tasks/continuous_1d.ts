import { Intensity1DInputSpec } from 'types/input/1d_intensity';
import {CommonContinuousTaskSpec} from '../task'
import { HTML5PlayerMedia} from '../players/html5'

/**
* @TJS-additionalProperties false
*/
export interface Continuous1DTaskBaseSpec {
    /**
     * @default "Continuous1DTask"
     */
    type: 'Continuous1DTask',
    /**
     * Media file to be displayed.
     */
    media: HTML5PlayerMedia
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
    intensityInput: Intensity1DInputSpec 
}

export interface Continuous1DTaskSpec extends Continuous1DTaskBaseSpec, CommonContinuousTaskSpec {}