import { BaseTaskSpec } from "@covfee-shared/spec/task"

/**
 * @TJS-additionalProperties false
 */
export interface TutorialTaskSpec extends BaseTaskSpec {
  /**
   * @default "TutorialTask"
   */
  type: "TutorialTask"
  /**
   * Media file to be displayed.
   */
  showPhoneField?: boolean
}
