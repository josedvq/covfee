// Important: import spec from a .ts file containing the spec only (Typescript type/interface).
// AVOID importing the spec from files containing or importing React components or other code.
// This could cause bugs when creating the schemata.
import { ContinuousAnnotationTaskSpec } from "@covfee-client/tasks/continuous_annotation/spec"
import { IncrementCounterTaskSpec } from "@covfee-client/tasks/increment_counter/spec"
import { InstructionsTaskSpec } from "@covfee-client/tasks/instructions/spec"
import { QuestionnaireTaskSpec } from "@covfee-client/tasks/questionnaire/spec"
import { TutorialTaskSpec } from "@covfee-client/tasks/tutorial/spec"
import { VideocallTaskSpec } from "@covfee-client/tasks/videocall/spec"

import { BaseNodeSpec } from "./node"

export interface BaseTaskSpec extends BaseNodeSpec {
  type: string
  /**
   * base of the custom API of this task
   */
  customApiBase?: string
}

/**
 * One of the supported task specs
 */
export type TaskSpec =
  | IncrementCounterTaskSpec
  | InstructionsTaskSpec
  | QuestionnaireTaskSpec
  | VideocallTaskSpec
  | TutorialTaskSpec
  | ContinuousAnnotationTaskSpec

export type NodeSpec = TaskSpec
