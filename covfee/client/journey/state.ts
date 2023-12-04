import { Action } from "@reduxjs/toolkit"
import { useContext } from "react"

import { nodeContext } from "./node_context"
import { useDispatch } from "react-redux"
import { appContext } from "../app_context"

export const useNodeState = () => {
  const { node, response, useSharedState } = useContext(nodeContext)
  const { socket } = useContext(appContext)

  const reduxDispatch = useDispatch()

  const dispatch = (action: Action) => {
    if (node.status !== "RUNNING") return

    if (useSharedState)
      socket.emit("action", { responseId: response.id, action })
    else reduxDispatch(action)
  }

  return {
    dispatch,
  }
}
