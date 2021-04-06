import { Continuous1DTaskSpec } from "./tasks/continuous_1d";
import { ContinuousKeypointTaskSpec } from "./tasks/continuous_keypoint";
import { InstructionsTaskSpec } from "./tasks/instructions";
import { QuestionnaireTaskSpec } from "./tasks/questionnaire";

/**
* @TJS-additionalProperties false
*/
export interface UserTaskSpec {
    /**
     * Task type 
     */
    type: string
}

/**
* @TJS-additionalProperties false
*/
export interface BaseTaskSpec {
    /**
     * Name of the task. It is displayed in covfee (eg. "Video 3")
     */
    name: string,
}

/**
* @TJS-additionalProperties false
*/
export interface ContinuousTaskSpec extends BaseTaskSpec { }

/**
 * One of the supported task specs
 */
export type TaskSpec = Continuous1DTaskSpec | ContinuousKeypointTaskSpec | InstructionsTaskSpec | QuestionnaireTaskSpec

export interface TaskResponse {
    id: number,
    task_id: number,
    hitinstance_id: string,
    index: number,
    submitted: boolean,
    data: object,
    chunk_data: object
}
export interface TaskObject {
    id: number,
    type: string,
    order: number,
    name: string,
    spec: object,
    responses: Array<TaskResponse>
}
