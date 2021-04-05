import {HitSpec} from './hit'

/**
* @TJS-additionalProperties false
*/
export interface ProjectSpec {
    /**
     * unique ID of the project
     */
    id: string
    /**
     * name of the project, used to identify it in the covfee interface.
     */
    name: string
    /**
     * email of the contact person for the project.
     */
    email: string
    /**
     * List of HIT specifications, one for each Human Intelligence Task in this project.
     */
    hits: Array<HitSpec>
}