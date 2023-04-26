import { CommonTaskSpec } from '../task'

/**
* @TJS-additionalProperties false
*/
export interface IncrementCounterTaskBaseSpec {
    /**
     * @default "IncrementCounterTask"
     */
    type: 'IncrementCounterTask'
}

/**
* @TJS-additionalProperties false
*/
export interface IncrementCounterTaskSpec extends IncrementCounterTaskBaseSpec, CommonTaskSpec {}