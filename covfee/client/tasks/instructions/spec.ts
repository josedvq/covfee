import { BaseTaskSpec } from "@covfee-shared/spec/task"
import { FormSpec, InputSpec } from "@covfee-shared/spec/form"
import { MarkdownContentSpec } from "@covfee-shared/spec/utils"

/**
 * @TJS-additionalProperties false
 */
export interface InstructionsTaskSpec extends BaseTaskSpec {
  /**
   * @default "InstructionsTask"
   */
  type: "InstructionsTask"
  /**
   * Main static content of the page (eg. consent terms, instructions)
   */
  content: MarkdownContentSpec
  /**
   * a form to display after the content.
   */
  form?: FormSpec<InputSpec>
}
