import { BaseTaskSpec } from "../task"
import { FormSpec, InputSpec } from "../form"
import { MarkdownContentSpec } from "./utils"

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
