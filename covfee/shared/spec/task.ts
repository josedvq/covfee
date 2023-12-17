import { InstructionsTaskSpec } from "./tasks/instructions"
import { QuestionnaireTaskSpec } from "./tasks/questionnaire"
import { VideocallTaskSpec } from "./tasks/videocall"
import { IncrementCounterTaskSpec } from "./tasks/increment_counter"
import { BaseNodeSpec } from "./node"

export interface BaseTaskSpec extends BaseNodeSpec {
  type: string
}

/**
 * One of the supported task specs
 */
export type TaskSpec =
  | IncrementCounterTaskSpec
  | InstructionsTaskSpec
  | QuestionnaireTaskSpec
  | VideocallTaskSpec

export type NodeSpec = TaskSpec
