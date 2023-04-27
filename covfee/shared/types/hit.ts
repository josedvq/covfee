import {TaskSpec, TaskType} from './task'
import { MarkdownContentSpec } from './tasks/utils'

export interface BaseInterface {
    /**
     * show / hide sidebar
     * @default true
     */
    showSidebar: boolean
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
 * The Shuffler defines a block of tasks that will be shuffled internally by covfee when a new HIT instance is created.
 * This is a recursive interface, to support recursive shuffling by embedding Shufflers within Shufflers.
 * Note that *tasks* should be an array of arrays of tasks (or Shufflers), and not simply an array of tasks.
 * @TJS-additionalProperties false
 */
export interface Shuffler {
    /**
     * @default "shuffle"
     */
    type: 'shuffle',
    tasks: TaskListObject[]
}

type TaskListObject = (Shuffler | TaskSpec)[]

export interface completionInfo {
    /**
     * Completion code to give back to participants. Used for crowdsourcing in eg. Prolific
     */
    completionCode?: string
    /**
     * Name/label of the website to redirect to
     */
    redirectName?: string
    /**
     * Redirect URL. URL to redirect participants to after completing the HIT.
     */
    redirectUrl?: string
}
/**
* @TJS-additionalProperties false
*/
export interface HitSpec {
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
    tasks: TaskListObject
    /**
     * number of copies or instances of the HIT
     */
    repeat?: number
    /**
     * Extra hit-level information to display
     */
    extra?: MarkdownContentSpec
    /**
     * Interface configuration options
     */
    interface?: AnnotationInterface | TimelineInterface
    /**
     * If true, the user will be required to log in before starting the task
     */
    requireLogin?: boolean
    /**
     * HIT configuration and other params
     */
    config?: completionInfo
}


// extends the specs with all the covfee-added fields
export type HitInstanceType = Omit<HitSpec, 'tasks'> & {
    /**
     * list of tasks in the HIT
     */
    tasks: Array<TaskType>
    /**
     * Total number of tasks in the HIT
     */
    num_tasks: number
    /**
     * True if the HIT was already submitted
     */
    submitted: boolean
    /**
     * Specifies the behavior when the HIT is submitted
     */
    completionInfo?: completionInfo
    /**
     * Date of HIT creation
     */
    created_at: string
    /**
     * Date the HIT was last updated
     */
    updated_at: string
    /**
     * Date the HIT instance was submitted
     */
    submitted_at: string
}