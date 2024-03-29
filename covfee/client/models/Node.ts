import React, { useState, useCallback, useEffect } from "react"
import {
  ManualStatus,
  ManualStatuses,
  NodeStatus,
  NodeType,
  TaskResponseType,
} from "../types/node"
import { fetcher, throwBadResponse } from "../utils"
import { MainSocket, ServerToClientEvents } from "../app_context"
import Constants from "Constants"

export function useNodeFns(node: NodeType) {
  const fetchResponse = useCallback(() => {
    const url = node.url + "/response?" + new URLSearchParams({})
    const p = fetcher(url).then(throwBadResponse)
    return p
  }, [node.url])

  const getAdminUrl = useCallback(() => {
    return Constants.admin.home_url + "/nodes/" + node.id
  }, [node.id])

  const setManualStatus = useCallback(
    (status: ManualStatus) => {
      const url = node.url + "/manual/" + ManualStatuses.indexOf(status)

      return fetcher(url).then(throwBadResponse)
    },
    [node.url]
  )

  const restart = useCallback(() => {
    const url = node.url + "/restart"

    return fetcher(url).then(throwBadResponse)
  }, [node.url])

  const submitResponse = useCallback(
    (responseUrl: string, data: any) => {
      const url = node.url + "/submit?" + new URLSearchParams({})

      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }

      // now send the task results
      return fetcher(url, requestOptions).then(throwBadResponse)
    },
    [node.url]
  )

  const makeResponse = useCallback(
    (response: TaskResponseType, data: any) => {
      const url = node.url + "/make_response?" + new URLSearchParams({})

      const requestOptions = {
        method: "POST",
      }

      return fetcher(url, requestOptions).then(throwBadResponse)
    },
    [node.url]
  )

  const setReady = useCallback(
    (value: boolean) => {
      if (!node.journey_id) {
        console.error("setReady called but node.journey_id is not set")
      }
      const url =
        Constants.api_url +
        "/journeys/" +
        node.journey_id +
        "/nodes/" +
        node.index +
        "/ready/" +
        (value ? "1" : "0")
      return fetcher(url)
    },
    [node.index, node.journey_id]
  )

  return {
    fetchResponse,
    getAdminUrl,
    submitResponse,
    makeResponse,
    setManualStatus,
    restart,
    setReady,
  }
}

export function useNode(data: NodeType, socket: MainSocket = null) {
  const [node, setNode] = useState<NodeType>(data)
  const [response, setResponse] = useState<TaskResponseType>(null)

  // extract the journey association (JourneyNode) data
  // includes ready status
  const journeyData = React.useMemo(() => {
    if (!node.journey_id) return null

    const curr = node.journeys.filter((j) => j.journey_id == node.journey_id)
    if (curr.length == 0) return null

    return curr[0]
  }, [node.journey_id, node.journeys])

  const {
    getAdminUrl: getUrl,
    fetchResponse: fetchResponseFn,
    makeResponse,
    submitResponse: submitResponseFn,
    setReady,
  } = useNodeFns(node)

  const numOnlineJourneys: number = React.useMemo(() => {
    const onlineArr = node.journeys.map((j) => j.online)
    const trueCount = onlineArr.reduce((accumulator, currentValue) => {
      return accumulator + (currentValue === true ? 1 : 0)
    }, 0)
    return trueCount
  }, [node.journeys])

  const setStatus = (status: NodeStatus) => {
    setNode((node) => ({
      ...node,
      status: status,
    }))
  }

  const fetchResponse = useCallback(() => {
    // const url = node.url + "/response?" + new URLSearchParams({})
    // const p = fetcher(url).then(throwBadResponse)
    // return p
    return fetchResponseFn().then((r) => {
      setResponse(r)
    })
  }, [fetchResponseFn])

  const submitResponse = (data: any) => submitResponseFn(response.url, data)

  useEffect(() => {
    const handleStatus: ServerToClientEvents["status"] = (data) => {
      if (data.id !== node.id) return

      console.log("IO: status", data)
      setNode((node) => ({
        ...node,
        status: data.new,
        paused: data.paused,
        manual: data.manual,
        journeys: data.journeys,
        dt_start: data.dt_start,
        dt_play: data.dt_play,
        dt_count: data.dt_count,
        dt_finish: data.dt_finish,
        t_elapsed: data.t_elapsed,
      }))
    }

    const handleJoin: ServerToClientEvents["join"] = (data) => {
      console.log("IO: join", data)

      setNode((node) => ({
        ...node,
        taskData: data.task_data,
      }))
    }

    if (socket) {
      socket.on("status", handleStatus)
      socket.on("join", handleJoin)
      return () => {
        socket.off("status", handleStatus)
        socket.off("join", handleJoin)
      }
    }
  }, [node.id, socket])

  return {
    node,
    journeyData,
    numOnlineJourneys,
    setNode,
    getUrl,
    response,
    setResponse,
    setStatus,
    fetchResponse,
    submitResponse,
    makeResponse,
    setReady,
  }
}

export const fetchNode = (id: number) => {
  const url = Constants.api_url + "/nodes/" + id

  return fetcher(url).then(throwBadResponse)
}
