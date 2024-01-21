import { BaseTaskSpec } from "../task"

/**
 * @TJS-additionalProperties false
 */
export interface IncrementCounterTaskSpec extends BaseTaskSpec {
  /**
   * @default "IncrementCounterTask"
   */
  type: "IncrementCounterTask"
}
