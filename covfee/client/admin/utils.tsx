import { styled } from "styled-components"
import { JourneyType } from "../types/journey"
import { NodeType } from "../types/node"

export const NodeColorStatuses = [
  "INIT",
  "COUNTDOWN",
  "RUNNING",
  "PAUSED",
  "FINISHED",
] as const
export type NodeColorStatus = (typeof NodeColorStatuses)[number]

export const JourneyColorStatuses = [
  "INIT",
  "RUNNING",
  "DISABLED",
  "FINISHED",
] as const
export type JourneyColorStatus = (typeof JourneyColorStatuses)[number]

export const NodeStatusToColor: Record<NodeColorStatus, string> = {
  INIT: "gray",
  COUNTDOWN: "#6495ED",
  RUNNING: "#6495ED",
  PAUSED: "orange",
  FINISHED: "#7dc238",
}

export const JourneyStatusToColor: Record<JourneyColorStatus, string> = {
  INIT: "gray",
  RUNNING: "#6495ED",
  DISABLED: "red",
  FINISHED: "#7dc238",
}

export const getNodeStatus = (
  node: Pick<NodeType, "status">
): NodeColorStatus => {
  return node.status
}

export const getJourneyStatus = (
  journey: Pick<JourneyType, "status" | "num_connections">
): JourneyColorStatus => {
  return journey.status
}

export const StatusIcon = styled.span<{ color: string }>`
  display: inline-block;
  width: 1em;
  height: 1em;
  margin-right: 0.2em;
  border-radius: 0.5em;
  background-color: ${(props) => props.color};
  vertical-align: middle;
`
