import { styled } from "styled-components"
import { JourneyType } from "../types/journey"
import { NodeType } from "../types/node"

export const NodeColorStatuses = [
  "INIT",
  "RUNNING",
  "PAUSED",
  "FINISHED",
] as const
export type NodeColorStatus = (typeof NodeColorStatuses)[number]
export const JourneyColorStatuses = [
  "INIT",
  "DISABLED",
  "ONLINE",
  "OFFLINE",
  "FINISHED",
] as const
export type JourneyColorStatus = (typeof JourneyColorStatuses)[number]

export const NodeStatusToColor: Record<NodeColorStatus, string> = {
  INIT: "gray",
  RUNNING: "#6495ED",
  PAUSED: "orange",
  FINISHED: "#7dc238",
}

export const JourneyStatusToColor: Record<JourneyColorStatus, string> = {
  INIT: "red",
  DISABLED: "black",
  ONLINE: "#6495ED",
  OFFLINE: "red",
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
  if (
    journey.status == "INIT" ||
    journey.status == "DISABLED" ||
    journey.status == "FINISHED"
  ) {
    return journey.status
  }
  if (journey.num_connections > 0) {
    return "ONLINE"
  } else {
    return "OFFLINE"
  }
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
