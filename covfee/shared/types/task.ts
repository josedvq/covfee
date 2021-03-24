export interface UserTaskSpec {
    /**
     * Task type 
     */
    type: string
}

export interface BaseTaskSpec {
    /**
     * Name of the task. It is displayed in covfee (eg. "Video 3")
     */
    name: string,
}
export interface ContinuousTaskSpec extends BaseTaskSpec { }

export interface TaskResponse {
    id: number,
    task_id: number,
    hitinstance_id: string,
    index: number,
    submitted: boolean,
    data: any,
    chunk_data: any
}
export interface TaskObject {
    id: number,
    type: string,
    order: number,
    name: string,
    spec: any,
    responses: Array<TaskResponse>
}
