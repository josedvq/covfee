import { Continuous1DTaskSpec } from "./tasks/continuous_1d"
import { ContinuousKeypointTaskSpec } from "./tasks/continuous_keypoint"
import { InstructionsTaskSpec } from "./tasks/instructions"
import { QuestionnaireTaskSpec } from "./tasks/questionnaire"
import { VideocallTaskSpec } from "./tasks/videocall"
import {ThreeImagesTaskSpec} from "./tasks/three_images"
import { IncrementCounterTaskSpec } from "./tasks/increment_counter"

/**
* @TJS-additionalProperties false
*/
export interface CommonTaskSpec {
    /**
     * Name of the task. It is displayed in covfee (eg. "Video 3")
     */
    name: string,
    /**
     * ID of the task. Used (if provided) only to name the download (results) files
     */
    id?: string
    /**
     * If true, this task must have a valid submission before the HIT can be submitted
     * @default True
     */
    required?: boolean
    /**
     * Task is marked as a prerrequisite
     * Prerrequisite tasks must be completed before the rests of the tasks in the HIT are revealed.
     * @default False
     */
    prerequisite?: boolean
    /**
     * If true, the task is shared among all instances of the HIT
     * Useful for group tasks requiring a single shared submission (symmetric)
     */
    shared?: boolean
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
     * Instructions to be displayed before the form
     */
    instructions?: string
    /**
     * How the instructions will be displayed
     * @default 'default'
     */
    instructionsType?: 'default' | 'popped'
}

/**
* @TJS-additionalProperties false
*/
export interface CommonContinuousTaskSpec extends CommonTaskSpec { }

/**
 * One of the supported task specs
 */
export type TaskSpec =  IncrementCounterTaskSpec | Continuous1DTaskSpec | ContinuousKeypointTaskSpec | InstructionsTaskSpec | QuestionnaireTaskSpec | ThreeImagesTaskSpec


