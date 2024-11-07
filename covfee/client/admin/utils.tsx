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

export const NodeStatusDescriptions: Record<NodeColorStatus, string> = {
  INIT: "Task is not yet started.",
  COUNTDOWN:
    "Starting conditions have been met. Task is counting down and will start promptly.",
  RUNNING: "Task is currently running.",
  PAUSED:
    "Task is paused. Either pause condition was met or admin paused the task.",
  FINISHED: "Task has finished.",
}

export const JourneyStatusToColor: Record<JourneyColorStatus, string> = {
  INIT: "gray",
  RUNNING: "#6495ED",
  DISABLED: "red",
  FINISHED: "#7dc238",
}

export const JourneyStatusDescritions: Record<JourneyColorStatus, string> = {
  INIT: "Journey is not yet started.",
  RUNNING: "Journey is currently running.",
  DISABLED: "Journey has been disabled by an admin.",
  FINISHED: "Journey has been completed.",
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
