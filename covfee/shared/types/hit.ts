import {MediaSpec} from './media'
import {UserTaskSpec} from './task'


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
    tasks: Array<any>
    /**
     * number of copies or instances of the HIT
     */
    repeat?: number
}

export interface AnnotationHitSpec extends HitBaseSpec {
    /**
     * type of HIT. 
     */
    type: 'annotation'
    /**
     * List of tasks specifications that users can create
     */
    interface: {
        userTasks: Record<string, UserTaskSpec>
    }
}

export interface TimelineHitSpec extends HitBaseSpec {
    /**
     * type of HIT. 
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