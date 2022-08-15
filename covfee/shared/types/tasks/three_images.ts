import { CommonTaskSpec } from '../task'
import {FormSpec, InputSpec} from '../form'
/**
* @TJS-additionalProperties false
*/
export interface ThreeImagesTaskBaseSpec {
    /**
     * @default "ThreeImagesTask"
     */
    type: 'ThreeImagesTask'
    /**
     * Text to display before the images
     */
    text?: string
    /**
     * URLs to the 3 images to be displayed
     */
    images: [string, string, string]
    /**
     * Specification of the form to be created.
     */
    form: FormSpec<InputSpec>
}

/**
* @TJS-additionalProperties false
*/
export interface ThreeImagesTaskSpec extends ThreeImagesTaskBaseSpec, CommonTaskSpec {}