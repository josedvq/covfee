import * as React from "react"
import { nodeContext } from "./node_context"
import { NodeType, TaskResponseType } from "../types/node"
import { appContext } from "../app_context"
import { useDispatch } from "react-redux"
import { Action } from "@reduxjs/toolkit"
import { ClientToServerEvents } from "../app_context"
import { AllPropsRequired } from "../types/utils"
import { PauseOutlined } from "@ant-design/icons"

export interface NodeProviderProps {
  node: NodeType
  paused: boolean
  /**
   * The node is disabled
   * Used in admin mode
   */
  disabled: boolean
  useSharedState: boolean
  emitState: () => any

  autosave?: boolean
  autosaveDelay?: number
  response?: TaskResponseType
}

export const NodeProvider: React.FC<
  React.PropsWithChildren<NodeProviderProps>
> = (props) => {
  const args: AllPropsRequired<NodeProviderProps> = React.useMemo(
    () => ({
      autosave: true,
      autosaveDelay: 2,
      response: null,
      ...props,
    }),
    [props]
  )

  const [nodeId, setNodeId] = React.useState<number>(null)
  const { socket } = React.useContext(appContext)

  const reduxDispatch = useDispatch()

  const timer = React.useRef(null)

  const dispatch = React.useCallback(
    (action: Action) => {
      if (args.node.status !== "RUNNING") return

      if (args.useSharedState)
        socket.emit("action", { nodeId: args.node.id, action })
      else {
        reduxDispatch(action)
        if (args.autosave) {
          if (timer.current) {
            clearTimeout(timer.current)
            timer.current = null
          }
          timer.current = setTimeout(args.emitState, args.autosaveDelay * 1000)
        }
      }
    },
    [
      args.node.status,
      args.node.id,
      args.useSharedState,
      args.autosave,
      args.emitState,
      args.autosaveDelay,
      socket,
      reduxDispatch,
    ]
  )

  return (
    <nodeContext.Provider
      value={{
        node: args.node,
        paused: args.paused,
        disabled: args.disabled,
        response: args.response,
        dispatch,
        useSharedState: args.useSharedState,
      }}
    >
      {props.children}
    </nodeContext.Provider>
  )
}
