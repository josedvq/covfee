import {TaskSpec, TaskType} from './task'
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

export interface BaseInterface {
    /**
     * Display a bar indicating progress as fraction of completed tasks
     */
    showProgress?: boolean,
    /**
     * Show the button to submit the HIT
     */
    showSubmitButton?: boolean
}

export interface AnnotationInterface extends BaseInterface{
    /**
     * type of interface.
     * @default "annotation"
     */
    type: 'annotation'
    /**
     * Allow the user to create tasks from the given map of id => task_spec
     */
    userTasks?: {[key: string]: TaskSpec}
}

export interface TimelineInterface extends BaseInterface {
    /**
     * type of interface.
     * @default "timeline"
     */
    type: 'timeline'
}

/**
* @TJS-additionalProperties false
*/
export interface HitSpec extends HitBaseSpec {
    
    /**
     * Interface configuration options
     */
    interface?: AnnotationInterface | TimelineInterface
}

// extends the specs with all the covfee-added fields
export type HitType = HitSpec & {
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
}