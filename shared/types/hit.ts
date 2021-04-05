import {TaskSpec, UserTaskSpec} from './task'
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
     * List of tasks specifications that users can create
     */
    interface: {
        userTasks: Record<string, UserTaskSpec>
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
    type: 'timeline'
}


export type HitSpec = AnnotationHitSpec | TimelineHitSpec


export interface HitProps {
    /**
     * unique ID of the hit
     */
    numSubmissions: number,
}