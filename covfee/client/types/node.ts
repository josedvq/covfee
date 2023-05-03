import { BaseTaskSpec, NodeSpec, TaskSpec } from "@covfee-spec/task"

export interface NodeType {
    /**
     * Unique ID of the node
     */
    id: number
    /**
     * URL to task api endpoint
     */
    url: string
    /**
     * Task specification as provided by the user
     */
    spec: NodeSpec
    submitted:boolean
    valid: boolean
}

export interface TaskResponseType {
    id: number,
    url: string,
    task_id: number,
    hitinstance_id: string,
    index: number,
    submitted: boolean,
    data: object,
    hasChunkData: boolean,
    chunkData?: object,
    state: any
}
export interface TaskType extends BaseTaskSpec {

    
    /**
     * number of times the task has been submitted
     */
    num_submissions: number
    /**
     * Sent when the latest response to the task is unsubmitted (used for resuming)
     */
    has_unsubmitted_responses: boolean
    /**
     * True if the task is a user task (can be edited)
     */
    editable: boolean
    /**
     * True if the task has been successfully validated
     */
    valid: boolean
    /**
     * Task-specific props to be fed to the task
     */
    taskSpecific?: any
}

export interface EditableTaskFields {
    /**
     * Display name of the task
     */
    name: string,
    /**
     * Task specification as provided by the user
     */
    // spec: any,
}

