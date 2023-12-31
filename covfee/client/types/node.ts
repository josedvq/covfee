import { RateSpec } from "@covfee-spec/form"
import { BaseNodeSpec } from "@covfee-spec/node"
import { BaseTaskSpec, NodeSpec, TaskSpec } from "@covfee-spec/task"
import React, { Reducer } from "react"
import { AllPropsRequired } from "./utils"
import { BaseTaskProps } from "../tasks/base"
import { Slice } from "@reduxjs/toolkit"

export const NodeStatuses = [
  "INIT",
  "COUNTDOWN",
  "RUNNING",
  "PAUSED",
  "FINISHED",
] as const
export type NodeStatus = (typeof NodeStatuses)[number]

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
