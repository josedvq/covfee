// Important: import spec from a .ts file containing the spec only (Typescript type/interface).
// AVOID importing the spec from files containing or importing React components or other code.
// This could cause bugs when creating the schemata.
import { QuestionnaireTaskSpec } from "@covfee-client/tasks/questionnaire/spec"
import { InstructionsTaskSpec } from "@covfee-client/tasks/instructions/spec"
import { IncrementCounterTaskSpec } from "@covfee-client/tasks/increment_counter/spec"
import { VideocallTaskSpec } from "@covfee-client/tasks/videocall/spec"
import { TutorialTaskSpec } from "@covfee-client/tasks/tutorial/spec"
import { ActionAnnotationTaskSpec } from "@covfee-client/tasks/action_annotation/spec"

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
  | TutorialTaskSpec
  | ActionAnnotationTaskSpec

export type NodeSpec = TaskSpec
