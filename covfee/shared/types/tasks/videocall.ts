import { CommonTaskSpec } from '../task'
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
     * Main static content of the page (eg. consent terms, instructions)
     */
    content: MarkdownContentSpec
}

/**
* @TJS-additionalProperties false
*/
export interface VideocallTaskSpec extends VideocallTaskBaseSpec, CommonTaskSpec {}