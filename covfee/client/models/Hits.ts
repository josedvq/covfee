import Constants from "Constants"
import React, { useState } from "react"
import { MainSocket, ServerToClientEvents } from "../app_context"
import { HitInstanceType } from "../types/hit"
import { NodeType } from "../types/node"
import { fetcher, throwBadResponse } from "../utils"
import { JourneyType } from "./Journey"

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

  const setHitData = (
    hitIndex: number,
    setter: (arg0: HitInstanceType) => HitInstanceType
  ) => {
    setHits((hits) =>
      Object.assign([], hits, {
        [hitIndex]: setter(hits[hitIndex]),
      })
    )
  }

  const setNodeData = React.useCallback(
    (hitIndex: number, nodeIndex: number, data: Partial<NodeType>) => {
      setHitData(hitIndex, (hit) => ({
        ...hit,
        nodes: Object.assign([], hit.nodes, {
          [nodeIndex]: {
            ...hit.nodes[nodeIndex],
            ...data,
          },
        }),
      }))
    },
    []
  )

  const setJourneyData = React.useCallback(
    (hitIndex: number, journeyIndex: number, data: Partial<JourneyType>) => {
      // const journeyIds = Object.keys(journeyIdToIndex);
      // if (!journeyIds.includes(journeyId)) return;
      // const journeyIndex = journeyIdToIndex[journeyId];
      setHitData(hitIndex, (hit) => ({
        ...hit,
        journeys: Object.assign([], hit.journeys, {
          [journeyIndex]: {
            ...hit.journeys[journeyIndex],
            ...data,
          },
        }),
      }))
    },
    []
  )

  React.useEffect(() => {
    const statusListener: ServerToClientEvents["status"] = (data) => {
      console.log("IO: status", data)
      if (!(data.hit_id in hitIdToIndex)) return
      const hitIndex = hitIdToIndex[data.hit_id]
      const nodeIndex = nodeIdToIndex[hitIndex][data.node_id]

      setNodeData(hitIndex, nodeIndex, {
        status: data.new,
        manual: data.manual,
        paused: data.paused,
        journeys: data.journeys,
        dt_start: data.dt_start,
        dt_play: data.dt_play,
        dt_count: data.dt_count,
        dt_finish: data.dt_finish,
        t_elapsed: data.t_elapsed,
      })
    }

    const journeyStatusListener: ServerToClientEvents["journey_status"] = ({
      hit_id,
      journey_id,
      num_connections,
      status,
    }) => {
      console.log("IO: journey_status")

      if (!(hit_id in hitIdToIndex)) return
      const hitIndex = hitIdToIndex[hit_id]
      const journeyIndex = journeyIdToIndex[hitIndex][journey_id]
      setJourneyData(hitIndex, journeyIndex, { num_connections, status })
    }

    if (socket) {
      socket.on("status", statusListener)
      socket.on("journey_status", journeyStatusListener)
    }
    return () => {
      socket.off("status", statusListener)
      socket.off("journey_status", journeyStatusListener)
    }
  }, [
    socket,
    hits,
    hitIdToIndex,
    nodeIdToIndex,
    journeyIdToIndex,
    setNodeData,
    setJourneyData,
  ])

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
