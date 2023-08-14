import React, { useState, useCallback, useEffect } from "react"
import { NodeStatus, NodeType, TaskResponseType } from "../types/node"
import { fetcher, throwBadResponse } from "../utils"
import { MainSocket } from "../app_context"
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

  const submitResponse = useCallback((responseUrl: string, data: any) => {
    const url = responseUrl + "/submit?" + new URLSearchParams({})

    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }

    // now send the task results
    return fetcher(url, requestOptions).then(throwBadResponse)
  }, [])

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
    if (socket) {
      socket.on("status", (data) => {
        setNode({
          ...node,
          status: data.new,
          curr_journeys: data.curr_journeys,
        })
      })
      return () => {
        socket.removeAllListeners("status")
      }
    }
  }, [node, socket])

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
