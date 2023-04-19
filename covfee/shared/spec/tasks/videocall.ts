import { CommonTaskSpec } from '../task'
import { FormSpec, InputSpec } from './questionnaire'
import {MarkdownContentSpec} from './utils'

/**
* @TJS-additionalProperties false
*/
export interface VideocallTaskBaseSpec {
    /**
     * @default "VideocallTask"
     */
    type: 'VideocallTask'
    /**
     * Type of view of the call participants
     * @default "speaker"
     */
    mode: 'speaker' | 'gallery'
    /**
     * Spec of the forms to be answered
     */
    queries: {
        /**
         * Time in seconds since the start of the call 
         */
        offset: number
        form: FormSpec<InputSpec>
    }[]
    /**
     * Minimum number of devices in the call necessary to start the queries
     */
    minDevices: number

}

/**
* @TJS-additionalProperties false
*/
export interface VideocallTaskSpec extends VideocallTaskBaseSpec, CommonTaskSpec {}