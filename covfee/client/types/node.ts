import { RateSpec } from "@covfee-spec/form"
import { BaseNodeSpec } from "@covfee-spec/node"
import { BaseTaskSpec, NodeSpec, TaskSpec } from "@covfee-spec/task"
import React, { Reducer } from "react"
import { AllPropsRequired } from "./utils"
import { BaseTaskProps } from "../tasks/base"

export const NodeStatuses = [
  "INIT",
  "WAITING",
  "RUNNING",
  "PAUSED",
  "FINISHED",
] as const
export type NodeStatus = (typeof NodeStatuses)[number]
/**
 * Node spec augmented with database status
 */
export interface NodeType extends AllPropsRequired<BaseNodeSpec> {
  id: number
  /**
   * URL to task api endpoint
   */
  chat_id: number
  url: string
  type: "TaskInstance" | "NodeInstance"
  /**
   * Task-specific arguments
   */
  spec: NodeSpec
  /**
   * Status of the node
   */
  status: NodeStatus
  taskData: any,
  num_journeys: number
  curr_journeys: string[]
  valid: boolean
}

export interface TaskResponseType {
  id: number
  url: string
  task_id: number
  hitinstance_id: string
  index: number
  submitted: boolean
  data: object
  hasChunkData: boolean
  chunkData?: object
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
}

export interface EditableTaskFields {
  /**
   * Display name of the task
   */
  name: string
  /**
   * Task specification as provided by the user
   */
  // spec: any,
}

export type NodeState<T> = T

export interface TaskExport {
  taskComponent: React.FC<BaseTaskProps>
  taskReducer: Reducer<any, any>
  useSharedState?: boolean
}
