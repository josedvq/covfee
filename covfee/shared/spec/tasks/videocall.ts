import { BaseTaskSpec } from '../task'
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
     * Layout mode
     * @default 'grid
     */
    layout: 'grid'
}

/**
* @TJS-additionalProperties false
*/
export interface VideocallTaskSpec extends VideocallTaskBaseSpec, BaseTaskSpec {}