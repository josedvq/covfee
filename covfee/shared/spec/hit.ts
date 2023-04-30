import {TaskSpec, TaskType} from './task'
import {JourneySpec} from './journey'
import { MarkdownContentSpec } from './tasks/utils'




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
    tasks: NodeSpec[]
}

type NodeSpec = (Shuffler | TaskSpec)[]

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
    nodes: NodeSpec
    /**
     * list of journeys in the HIT
     */
    journeys: JourneySpec
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


