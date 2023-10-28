import { Continuous1DTaskSpec } from "./tasks/continuous_1d";
import { ContinuousKeypointTaskSpec } from "./tasks/continuous_keypoint";
import { InstructionsTaskSpec } from "./tasks/instructions";
import { QuestionnaireTaskSpec } from "./tasks/questionnaire";
import { VideocallTaskSpec } from "./tasks/videocall";
import { ThreeImagesTaskSpec } from "./tasks/three_images";
import { IncrementCounterTaskSpec } from "./tasks/increment_counter";
import { BaseNodeSpec } from "./node";

export interface BaseTaskSpec extends BaseNodeSpec {}

/**
 * One of the supported task specs
 */
export type TaskSpec =
  | IncrementCounterTaskSpec
  | Continuous1DTaskSpec
  | ContinuousKeypointTaskSpec
  | InstructionsTaskSpec
  | QuestionnaireTaskSpec
  | ThreeImagesTaskSpec
  | VideocallTaskSpec

export type NodeSpec = TaskSpec;
