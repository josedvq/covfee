import { JourneySpec } from "@covfee-spec/journey"
import { NodeType } from "./node"
import { MarkdownContentSpec } from "@covfee-spec/tasks/utils"

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
  completionInfo?: any
  num_connections: number
  curr_node_id: number
  status: JourneyApiStatus
}
