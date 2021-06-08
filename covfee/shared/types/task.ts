
import { Continuous1DTaskSpec, Continuous1DTaskBaseSpec } from "./tasks/continuous_1d";
import { ContinuousKeypointTaskSpec, ContinuousKeypointTaskBaseSpec } from "./tasks/continuous_keypoint";
import { InstructionsTaskSpec, InstructionsTaskBaseSpec } from "./tasks/instructions";
import { QuestionnaireTaskSpec, QuestionnaireTaskBaseSpec } from "./tasks/questionnaire";

type DistributiveOmit<T, K extends keyof T> = T extends unknown
    ? Omit<T, K>
    : never;

type DistributivePick<T, K extends keyof T> = T extends unknown
    ? Pick<T, K>
    : never;

/**
* @TJS-additionalProperties false
*/
export interface CommonTaskSpec {
    /**
     * Name of the task. It is displayed in covfee (eg. "Video 3")
     */
    name: string,
    /**
     * Task is marked as a prerrequisite
     * Prerrequisite tasks must be completed before the rests of the tasks in the HIT are revealed.
     */
    prerequisite?: boolean
    /**
     * Timing config
     */
    timer?: {
        /**
         * Max time (in seconds) the user may take to complete the task
         * @default 0
         */
        maxTime: number
    }
    /**
     * Maximum number of submissions a user can make for the task.
     * @default 0
     */
    maxSubmissions?: number
    /**
     * Tasks will be submitted automatically when the media or timer ends.
     * @default false
     */
    autoSubmit?: boolean
    /**
     * children tasks
     */
    children?: Array<ChildTaskSpec>
    /**
     * Instructions to be displayed before the form
     */
    instructions?: string
}

/**
* @TJS-additionalProperties false
*/
export interface CommonContinuousTaskSpec extends CommonTaskSpec { }

/**
 * One of the supported task specs
 */

export type TaskSpec =  Continuous1DTaskSpec | ContinuousKeypointTaskSpec | InstructionsTaskSpec | QuestionnaireTaskSpec
export type ChildTaskSpec = DistributiveOmit<TaskSpec, 'media'>
export type BaseTaskSpec = Continuous1DTaskBaseSpec | ContinuousKeypointTaskBaseSpec | InstructionsTaskBaseSpec | QuestionnaireTaskBaseSpec

export interface TaskResponse {
    id: number,
    task_id: number,
    hitinstance_id: string,
    index: number,
    submitted: boolean,
    data: object,
    hasChunkData: boolean,
    chunkData?: object
}
export interface TaskType extends Omit<CommonTaskSpec, 'children'> {
    children: Array<TaskType>
    /**
     * Unique ID of the task
     */
    id: number
    /**
     * URL to task api endpoint
     */
    url: string
    /**
     * Task specification as provided by the user
     */
    spec: BaseTaskSpec
    /**
     * number of times the task has been submitted
     */
    num_submissions: number
    /**
     * Sent when the latest response to the task is unsubmitted (used for resuming)
     */
    has_unsubmitted_responses: boolean
    /**
     * True if the task is a user task (can be edited)
     */
    editable: boolean
    /**
     * True if the task has been successfully validated
     */
    valid: boolean
}

export interface EditableTaskFields {
    /**
     * Display name of the task
     */
    name: string,
    /**
     * Task specification as provided by the user
     */
    spec: BaseTaskSpec,
}


