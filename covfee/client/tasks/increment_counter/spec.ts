import { BaseTaskSpec } from "@covfee-shared/spec/task"

/**
 * @TJS-additionalProperties false
 */
export interface IncrementCounterTaskSpec extends BaseTaskSpec {
  /**
   * @default "IncrementCounterTask"
   */
  type: "IncrementCounterTask"
}
