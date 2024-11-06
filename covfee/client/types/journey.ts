import { JourneySpec } from "@covfee-spec/journey"
import { MarkdownContentSpec } from "@covfee-spec/tasks/utils"
import { NodeType } from "./node"

export const JourneyApiStatuses = [
  "INIT",
  "RUNNING",
  "DISABLED",
  "FINISHED",
] as const
export type JourneyApiStatus = (typeof JourneyApiStatuses)[number]
export interface JourneyType extends Omit<JourneySpec, "nodes"> {
  id: string
  hit_id: string
  journeyspec_id: number
  hitspec_id: number
  chat_id: number
  nodes: NodeType[]
  extra: MarkdownContentSpec
  submitted: boolean
  completion_info?: any
  num_connections: number
  curr_node_id: number
  status: JourneyApiStatus
}
