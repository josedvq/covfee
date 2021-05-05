import {PresetsSpec, TaskSpec, TaskType, UserTaskSpec} from './task'
import { MarkdownContentSpec } from './tasks/utils'

/**
* @TJS-additionalProperties false
*/
export interface HitBaseSpec {
    /**
     * unique ID of the hit
     */
    id: string
    /**
     * HIT name (for display)
     */
    name: string
    /**
     * list of tasks in the HIT
     */
    tasks: Array<TaskSpec>
    /**
     * number of copies or instances of the HIT
     */
    repeat?: number
    /**
     * Extra hit-level information to display
     */
    extra?: MarkdownContentSpec
}

/**
* @TJS-additionalProperties false
*/
export interface AnnotationHitSpec extends HitBaseSpec {
    /**
     * type of HIT.
     * @default "annotation"
     */
    type: 'annotation'
    /**
     * Interface configuration options
     */
    interface?: {
        /**
         * Allow the user to create tasks from the given map of id => task_spec
         */
        userTasks?: {[key: string]: TaskSpec}
    }
}

/**
* @TJS-additionalProperties false
*/
export interface TimelineHitSpec extends HitBaseSpec {
    /**
     * type of HIT. 
     * @default "timeline"
     */
    type: 'timeline',
    /**
     * Interface configuration options
     */
    interface?: {
        /**
         * Display a bar indicating progress in the timeline
         */
        showProgress?: boolean,
    }
}

export type HitSpec = AnnotationHitSpec | TimelineHitSpec

// extends the specs with all the covfee-added fields
export type HitType = (AnnotationHitSpec | TimelineHitSpec) & {
    /**
     * list of tasks in the HIT
     */
    tasks: Array<TaskType>
    /**
     * True if the HIT was already submitted
     */
    submitted: boolean
    /**
     * Interface configuration object
     */
    num_submissions: number,
    /**
     * If true, the hit contains only prerequisite tasks
     */
    only_prerequisites?: boolean
}