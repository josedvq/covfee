import React, { useState } from "react"
import { HitInstanceType } from "../types/hit"
import { fetcher, throwBadResponse } from "../utils"
import Constants from "Constants"
import { MainSocket, ServerToClientEvents } from "../app_context"
import { JourneyType } from "./Journey"
import { NodeType } from "../types/node"

export const useHitInstances = (
  data: HitInstanceType[],
  socket: MainSocket = null
) => {
  const [hits, setHits] = useState(data)

  const hitIdToIndex = Object.fromEntries(
    data.map((hit, index) => [hit.id, index])
  )

  const journeyIdToIndex = data.map((hit) =>
    Object.fromEntries(hit.journeys.map((j, i) => [j.id, i]))
  )

  const nodeIdToIndex = data.map((hit) =>
    Object.fromEntries(hit.nodes.map((node, i) => [node.id, i]))
  )

  React.useEffect(() => {
    const setHitData = (hitIndex: number, data: Partial<HitInstanceType>) => {
      setHits(
        Object.assign([], hits, {
          [hitIndex]: {
            ...hits[hitIndex],
            ...data,
          },
        })
      )
    }

    const setNodeData = (
      hitIndex: number,
      nodeIndex: number,
      data: Partial<NodeType>
    ) => {
      setHitData(hitIndex, {
        nodes: Object.assign([], hits[hitIndex].nodes, {
          [nodeIndex]: {
            ...hits[hitIndex].nodes[nodeIndex],
            ...data,
          },
        }),
      })
    }

    const setJourneyData = (
      hitIndex: number,
      journeyIndex: number,
      data: Partial<JourneyType>
    ) => {
      // const journeyIds = Object.keys(journeyIdToIndex);
      // if (!journeyIds.includes(journeyId)) return;
      // const journeyIndex = journeyIdToIndex[journeyId];
      setHitData(hitIndex, {
        journeys: Object.assign([], hits[hitIndex].journeys, {
          [journeyIndex]: {
            ...hits[hitIndex].journeys[journeyIndex],
            ...data,
          },
        }),
      })
    }

    const statusListener: ServerToClientEvents["status"] = (data) => {
      console.log("IO: status", data)
      if (!(data.hit_id in hitIdToIndex)) return
      const hitIndex = hitIdToIndex[data.hit_id]
      const nodeIndex = nodeIdToIndex[hitIndex][data.id]

      setNodeData(hitIndex, nodeIndex, {
        status: data.new,
        paused: data.paused,
        journeys: data.journeys,
      })
    }

    const journeyConnectListener: ServerToClientEvents["journey_connect"] = ({
      hit_id,
      journey_id,
      num_connections,
    }) => {
      if (!(hit_id in hitIdToIndex)) return
      const hitIndex = hitIdToIndex[hit_id]
      const journeyIndex = journeyIdToIndex[hitIndex][journey_id]
      setJourneyData(hitIndex, journeyIndex, { num_connections })
    }

    if (socket) {
      socket.on("status", statusListener)
      socket.on("journey_connect", journeyConnectListener)
    }
    return () => {
      socket.off("status", statusListener)
      socket.off("journey_connect", journeyConnectListener)
    }
  }, [socket, hits])

  const setCollapsed = async (value: boolean) => {
    return update({ collapsed: value })
  }

  const setShowGraph = async (value: boolean) => {
    return update({ show_graph: value })
  }

  const setShowJourneys = async (value: boolean) => {
    return update({ show_journeys: value })
  }

  const setShowNodes = async (value: boolean) => {
    return update({ show_nodes: value })
  }

  const update = async (hit: Partial<HitInstanceType>) => {
    const url = hits.api_url + "/edit?" + new URLSearchParams({})

    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(hit),
    }

    return fetcher(url, requestOptions)
      .then(throwBadResponse)
      .then((res) => {
        setHits((curr) => ({
          ...curr,
          ...res,
        }))
      })
  }

  return {
    hits,
    setHits,
    update,
    setCollapsed,
    setShowGraph,
    setShowJourneys,
    setShowNodes,
  }
}

export function getHit(id: number) {
  const url =
    Constants.api_url +
    "/hits/" +
    id +
    "?" +
    new URLSearchParams({
      with_instances: "1",
      with_instance_nodes: "1",
    })

  fetcher(url).then(throwBadResponse)
}

export function getHitInstance(id: string) {
  const url =
    Constants.api_url +
    "/instances/" +
    id +
    "?" +
    new URLSearchParams({
      with_nodes: "1",
    })

  return fetcher(url).then(throwBadResponse)
}
