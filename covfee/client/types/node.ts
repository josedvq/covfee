import { BaseNodeSpec } from "@covfee-spec/node"
import { BaseTaskSpec, NodeSpec } from "@covfee-spec/task"
import { Slice } from "@reduxjs/toolkit"
import React from "react"
import { BaseTaskProps } from "../tasks/base"
import { AllPropsRequired } from "./utils"

export const NodeStatuses = [
  "INIT",
  "COUNTDOWN",
  "RUNNING",
  "PAUSED",
  "FINISHED",
] as const
export type NodeStatus = (typeof NodeStatuses)[number]

export const ManualStatuses = ["DISABLED", "RUNNING", "PAUSED"] as const
export type ManualStatus = (typeof ManualStatuses)[number]

export type JourneyAssoc = {
  journey_id: string
  player: number
  ready: boolean
  online: boolean
}

/**
 * Node spec augmented with database status
 */
export interface NodeType extends AllPropsRequired<BaseNodeSpec> {
  id: number
  index?: number
  journey_id?: string
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
  manual: ManualStatus
  taskData: any
  journeys: JourneyAssoc[]
  valid: boolean
  paused: boolean
  dt_start: string
  dt_pause: string
  dt_count: string
  dt_play: string
  dt_empty: string
  dt_finish: string
  t_elapsed: number
  customApiBase: string
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
  taskSlice: Slice<any, any>
  useSharedState?: boolean
}
