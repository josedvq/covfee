import React, { useState, useCallback, useEffect } from "react"
import { NodeStatus, NodeType, TaskResponseType } from "../types/node"
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

  const pause = useCallback(
    (pause: boolean) => {
      const url = node.url + "/pause/" + (pause ? "1" : "0")

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

  return {
    fetchResponse,
    getAdminUrl,
    submitResponse,
    makeResponse,
    pause,
    restart,
  }
}

export function useNode(data: NodeType, socket: MainSocket = null) {
  const [node, setNode] = useState<NodeType>(data)
  const [response, setResponse] = useState<TaskResponseType>(null)

  const {
    getAdminUrl: getUrl,
    fetchResponse: fetchResponseFn,
    makeResponse,
    submitResponse: submitResponseFn,
  } = useNodeFns(node)

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
      console.log("IO: status", data)
      setNode((node) => ({
        ...node,
        status: data.new,
        paused: data.paused,
        curr_journeys: data.curr_journeys,
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
  }, [socket])

  return {
    node,
    setNode,
    getUrl,
    response,
    setStatus,
    fetchResponse,
    submitResponse,
    makeResponse,
  }
}

export const fetchNode = (id: number) => {
  const url = Constants.api_url + "/nodes/" + id

  return fetcher(url).then(throwBadResponse)
}
