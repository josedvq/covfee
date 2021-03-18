import {MediaSpec} from './media'

export interface UserTaskSpec {
    /**
     * Task type 
     */
    type: string
}

export interface BaseTaskSpec {
    /**
     * Task type 
     */
    type: string,
    /**
     * Name of the task. It is displayed in covfee (eg. "Video 3")
     */
    name: string,
    /**
     * Media file to be displayed.
     */
    media: MediaSpec
}

export interface ContinuousTaskSpec extends BaseTaskSpec {

}
